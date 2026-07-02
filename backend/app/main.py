import calendar
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from . import models, schemas
from .auth import get_current_user, get_optional_user, hash_password, verify_password, create_access_token
from .database import SessionLocal, engine, get_db
from .migrations import backfill_dates, backfill_subscription_flag, ensure_schema


def generate_recurring_for_month(db: Session, year: int, month: int) -> int:
    """Create the real Expense/Income row for every active recurring template
    for the given month, unless one already exists for it - safe to call repeatedly."""
    last_day = calendar.monthrange(year, month)[1]
    month_start = date(year, month, 1)
    month_end = date(year, month, last_day)

    templates = db.query(models.RecurringEntry).filter(models.RecurringEntry.active.is_(True)).all()
    created = 0

    for tpl in templates:
        target_date = date(year, month, min(tpl.day_of_month, last_day))

        if tpl.type == "expense":
            exists = (
                db.query(models.Expense)
                .filter(
                    models.Expense.recurring_id == tpl.id,
                    models.Expense.date >= month_start,
                    models.Expense.date <= month_end,
                )
                .first()
            )
            if exists:
                continue
            db.add(
                models.Expense(
                    description=tpl.description,
                    amount=tpl.amount,
                    category=tpl.category,
                    date=target_date,
                    recurring_id=tpl.id,
                    user_id=tpl.user_id,
                    household_id=tpl.household_id,
                )
            )
            created += 1
        else:
            exists = (
                db.query(models.Income)
                .filter(
                    models.Income.recurring_id == tpl.id,
                    models.Income.date >= month_start,
                    models.Income.date <= month_end,
                )
                .first()
            )
            if exists:
                continue
            db.add(
                models.Income(
                    description=tpl.description,
                    amount=tpl.amount,
                    source=tpl.source,
                    date=target_date,
                    recurring_id=tpl.id,
                    user_id=tpl.user_id,
                    household_id=tpl.household_id,
                )
            )
            created += 1

    if created:
        db.commit()
    return created


def _generate_current_month(db: Session) -> None:
    today = datetime.now(timezone.utc).date()
    generate_recurring_for_month(db, today.year, today.month)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_schema(engine)
    models.Base.metadata.create_all(bind=engine)
    backfill_dates(SessionLocal, models)
    backfill_subscription_flag(SessionLocal, models)

    db = SessionLocal()
    try:
        _generate_current_month(db)
    finally:
        db.close()

    yield


app = FastAPI(title="Expense Tracker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app)


def _get_settings(db: Session, user: Optional[models.User] = None) -> models.BudgetSettings:
    q = db.query(models.BudgetSettings)
    settings = None
    if user:
        # Household members share one budget-settings row (stamped with household_id).
        if user.household_id:
            settings = q.filter(models.BudgetSettings.household_id == user.household_id).first()
        if settings is None:
            settings = q.filter(models.BudgetSettings.user_id == user.id).first()
    else:
        settings = q.first()
    if settings is None:
        settings = models.BudgetSettings(
            monthly_savings_goal=0.0,
            monthly_spending_limit=0.0,
            user_id=user.id if user else None,
            household_id=user.household_id if user else None,
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def _income_by_source(db: Session, user: Optional[models.User] = None) -> schemas.IncomeBySource:
    q = db.query(models.Income.source, func.sum(models.Income.amount))
    q = _apply_visibility_filter(q, models.Income, user)
    rows = q.group_by(models.Income.source).all()
    totals = {"husband": 0.0, "wife": 0.0, "other": 0.0}
    for source, total in rows:
        key = source if source in totals else "other"
        totals[key] += total or 0.0
    return schemas.IncomeBySource(
        husband=round(totals["husband"], 2),
        wife=round(totals["wife"], 2),
        other=round(totals["other"], 2),
    )


def _apply_visibility_filter(query, model, user: Optional[models.User]):
    """Filter rows visible to the current user: own rows + household shared rows.
    When unauthenticated (user=None), all rows are returned for backward-compat."""
    if user is None:
        return query
    conditions = [model.user_id == user.id, model.user_id.is_(None)]
    if user.household_id:
        conditions.append(model.household_id == user.household_id)
    return query.filter(or_(*conditions))


def _check_ownership(entry, user: Optional[models.User]) -> None:
    """Raise 403 if the authenticated user doesn't own or share this entry."""
    if user is None:
        return
    if entry.user_id is None:
        return
    if entry.user_id == user.id:
        return
    if user.household_id and entry.household_id == user.household_id:
        return
    raise HTTPException(status_code=403, detail="Not authorized to modify this entry")


def _resolve_household(is_shared: bool, user: Optional[models.User]) -> Optional[int]:
    """Return household_id to stamp on a row, or None."""
    if is_shared and user and user.household_id:
        return user.household_id
    return None


_reset_attempts: dict = defaultdict(list)


def _check_reset_rate_limit(email: str) -> bool:
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=15)
    _reset_attempts[email] = [t for t in _reset_attempts[email] if t > cutoff]
    if len(_reset_attempts[email]) >= 5:
        return False
    _reset_attempts[email].append(now)
    return True


# ---------- Healthcheck ----------


@app.get("/healthz")
def health():
    return {"status": "ok"}


# ---------- Auth ----------


auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name or payload.email.split("@")[0],
        security_question=payload.security_question,
        security_answer_hash=hash_password(payload.security_answer.strip().lower()) if payload.security_answer else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@auth_router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id, remember_me=payload.remember_me)
    return schemas.TokenOut(access_token=token)


@auth_router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@auth_router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    payload: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    current_user.first_name = payload.first_name
    current_user.last_name = payload.last_name
    current_user.display_name = payload.display_name or current_user.display_name
    if payload.security_question is not None:
        current_user.security_question = payload.security_question
    if payload.security_answer:
        current_user.security_answer_hash = hash_password(payload.security_answer.strip().lower())
    db.commit()
    db.refresh(current_user)
    return current_user


@auth_router.post("/avatar", response_model=schemas.UserOut)
def update_avatar(
    payload: schemas.AvatarUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    current_user.avatar_data = payload.avatar_data
    db.commit()
    db.refresh(current_user)
    return current_user


@auth_router.post("/forgot-password/question")
def get_forgot_password_question(payload: schemas.ForgotPasswordQuestion, db: Session = Depends(get_db)):
    """Returns the security question for the email. Always returns 200 with a generic
    structure to prevent email enumeration attacks."""
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.security_question:
        return {"question": None}
    return {"question": user.security_question}


@auth_router.post("/reset-password")
def reset_password(payload: schemas.ForgotPasswordReset, db: Session = Depends(get_db)):
    if not _check_reset_rate_limit(payload.email):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.security_answer_hash:
        raise HTTPException(status_code=400, detail="Cannot reset password for this account.")
    if not verify_password(payload.answer.strip().lower(), user.security_answer_hash):
        raise HTTPException(status_code=400, detail="Incorrect answer.")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password reset successfully."}


app.include_router(auth_router)


# ---------- Household ----------


household_router = APIRouter(prefix="/household", tags=["household"])


@household_router.post("/create", response_model=schemas.HouseholdOut, status_code=201)
def create_household(
    payload: schemas.HouseholdCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.household_id:
        raise HTTPException(status_code=400, detail="Already in a household. Leave first.")
    household = models.Household(name=payload.name, created_by=current_user.id)
    db.add(household)
    db.flush()
    current_user.household_id = household.id
    db.commit()
    db.refresh(household)
    db.refresh(current_user)
    return household


@household_router.post("/join")
def join_household(
    payload: schemas.HouseholdJoin,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.household_id:
        raise HTTPException(status_code=400, detail="Already in a household. Leave first.")
    household = db.query(models.Household).filter(models.Household.invite_code == payload.invite_code).first()
    if not household:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    current_user.household_id = household.id
    db.commit()
    db.refresh(household)
    return household


@household_router.get("/me", response_model=schemas.HouseholdOut)
def get_my_household(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not current_user.household_id:
        raise HTTPException(status_code=404, detail="Not in a household")
    household = db.get(models.Household, current_user.household_id)
    return household


@household_router.post("/leave")
def leave_household(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    current_user.household_id = None
    db.commit()
    return {"message": "Left household"}


app.include_router(household_router)


# ---------- Expenses ----------


@app.get("/expenses", response_model=list[schemas.ExpenseOut])
def list_expenses(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    _generate_current_month(db)
    q = db.query(models.Expense).order_by(models.Expense.date.desc(), models.Expense.created_at.desc())
    return _apply_visibility_filter(q, models.Expense, current_user).all()


@app.post("/expenses", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    data = expense.model_dump()
    if data.get("date") is None:
        data["date"] = datetime.now(timezone.utc).date()
    is_shared = data.pop("is_shared", False)
    if current_user:
        data["user_id"] = current_user.id
        data["household_id"] = _resolve_household(is_shared, current_user)
    db_expense = models.Expense(**data)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    payload: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    _check_ownership(expense, current_user)
    expense.amount = payload.amount
    if payload.description is not None:
        expense.description = payload.description
    if payload.category is not None:
        expense.category = payload.category
    if payload.date is not None:
        expense.date = payload.date
    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    _check_ownership(expense, current_user)
    db.delete(expense)
    db.commit()


# ---------- Income ----------


@app.get("/income", response_model=list[schemas.IncomeOut])
def list_income(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    _generate_current_month(db)
    q = db.query(models.Income).order_by(models.Income.date.desc(), models.Income.created_at.desc())
    return _apply_visibility_filter(q, models.Income, current_user).all()


@app.post("/income", response_model=schemas.IncomeOut, status_code=201)
def create_income(
    income: schemas.IncomeCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    data = income.model_dump()
    if data.get("date") is None:
        data["date"] = datetime.now(timezone.utc).date()
    is_shared = data.pop("is_shared", False)
    if current_user:
        data["user_id"] = current_user.id
        data["household_id"] = _resolve_household(is_shared, current_user)
    db_income = models.Income(**data)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income


@app.put("/income/{income_id}", response_model=schemas.IncomeOut)
def update_income(
    income_id: int,
    payload: schemas.IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    income = db.get(models.Income, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    _check_ownership(income, current_user)
    income.amount = payload.amount
    if payload.description is not None:
        income.description = payload.description
    if payload.source is not None:
        income.source = payload.source
    if payload.date is not None:
        income.date = payload.date
    db.commit()
    db.refresh(income)
    return income


@app.delete("/income/{income_id}", status_code=204)
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    income = db.get(models.Income, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    _check_ownership(income, current_user)
    db.delete(income)
    db.commit()


@app.get("/income/summary", response_model=schemas.IncomeSummary)
def income_summary(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    by_source = _income_by_source(db, current_user)
    total = round(by_source.husband + by_source.wife + by_source.other, 2)
    return schemas.IncomeSummary(total=total, by_source=by_source)


# ---------- Budget settings ----------


@app.get("/budget-settings", response_model=schemas.BudgetSettingsOut)
def get_budget_settings(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    return _get_settings(db, current_user)


@app.put("/budget-settings", response_model=schemas.BudgetSettingsOut)
def update_budget_settings(
    payload: schemas.BudgetSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    settings = _get_settings(db, current_user)
    settings.monthly_savings_goal = payload.monthly_savings_goal
    settings.monthly_spending_limit = payload.monthly_spending_limit
    db.commit()
    db.refresh(settings)
    return settings


# ---------- Recurring entries ----------


@app.get("/recurring", response_model=list[schemas.RecurringOut])
def list_recurring(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    q = db.query(models.RecurringEntry).order_by(models.RecurringEntry.created_at.desc())
    return _apply_visibility_filter(q, models.RecurringEntry, current_user).all()


@app.post("/recurring", response_model=schemas.RecurringOut, status_code=201)
def create_recurring(
    payload: schemas.RecurringCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    data = payload.model_dump()
    is_shared = data.pop("is_shared", False)
    if current_user:
        data["user_id"] = current_user.id
        data["household_id"] = _resolve_household(is_shared, current_user)
    entry = models.RecurringEntry(**data)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@app.put("/recurring/{recurring_id}", response_model=schemas.RecurringOut)
def update_recurring(
    recurring_id: int,
    payload: schemas.RecurringUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    entry = db.get(models.RecurringEntry, recurring_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Recurring entry not found")
    _check_ownership(entry, current_user)
    for key, value in payload.model_dump().items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


@app.delete("/recurring/{recurring_id}", status_code=204)
def delete_recurring(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    entry = db.get(models.RecurringEntry, recurring_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Recurring entry not found")
    _check_ownership(entry, current_user)
    db.query(models.Expense).filter(models.Expense.recurring_id == recurring_id).update({"recurring_id": None})
    db.query(models.Income).filter(models.Income.recurring_id == recurring_id).update({"recurring_id": None})
    db.delete(entry)
    db.commit()


@app.post("/recurring/run")
def run_recurring(db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    created = generate_recurring_for_month(db, today.year, today.month)
    return {"created": created}


# ---------- Subscriptions ----------


@app.get("/subscriptions", response_model=schemas.SubscriptionsOut)
def list_subscriptions(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    q = (
        db.query(models.RecurringEntry)
        .filter(
            models.RecurringEntry.type == "expense",
            models.RecurringEntry.is_subscription.is_(True),
            models.RecurringEntry.active.is_(True),
        )
        .order_by(models.RecurringEntry.amount.desc())
    )
    items = _apply_visibility_filter(q, models.RecurringEntry, current_user).all()
    monthly_total = round(sum(item.amount for item in items), 2)
    yearly_total = round(monthly_total * 12, 2)
    return schemas.SubscriptionsOut(
        items=items,
        summary=schemas.SubscriptionsSummary(
            monthly_total=monthly_total,
            yearly_total=yearly_total,
            count=len(items),
        ),
    )


# ---------- Accounts ----------


@app.get("/accounts", response_model=list[schemas.AccountOut])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    q = db.query(models.Account).order_by(models.Account.created_at.desc())
    return _apply_visibility_filter(q, models.Account, current_user).all()


@app.post("/accounts", response_model=schemas.AccountOut, status_code=201)
def create_account(
    payload: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    data = payload.model_dump()
    is_shared = data.pop("is_shared", False)
    if current_user:
        data["user_id"] = current_user.id
        data["household_id"] = _resolve_household(is_shared, current_user)
    account = models.Account(**data)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@app.put("/accounts/{account_id}", response_model=schemas.AccountOut)
def update_account(
    account_id: int,
    payload: schemas.AccountUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    account = db.get(models.Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    _check_ownership(account, current_user)
    for key, value in payload.model_dump().items():
        setattr(account, key, value)
    db.commit()
    db.refresh(account)
    return account


@app.delete("/accounts/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    account = db.get(models.Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    _check_ownership(account, current_user)
    db.delete(account)
    db.commit()


@app.get("/accounts/networth", response_model=schemas.NetWorthSummary)
def get_net_worth(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    q_assets = db.query(func.sum(models.Account.balance)).filter(models.Account.type == "asset")
    q_liab = db.query(func.sum(models.Account.balance)).filter(models.Account.type == "liability")
    q_assets = _apply_visibility_filter(q_assets, models.Account, current_user)
    q_liab = _apply_visibility_filter(q_liab, models.Account, current_user)
    total_assets = q_assets.scalar() or 0.0
    total_liabilities = q_liab.scalar() or 0.0
    return schemas.NetWorthSummary(
        total_assets=round(total_assets, 2),
        total_liabilities=round(total_liabilities, 2),
        net_worth=round(total_assets - total_liabilities, 2),
    )


# ---------- Forecast ----------


def _add_months(year: int, month: int, offset: int) -> tuple[int, int]:
    total = (year * 12 + (month - 1)) + offset
    return total // 12, total % 12 + 1


@app.get("/forecast", response_model=list[schemas.ForecastMonth])
def forecast(
    months: int = Query(default=6, ge=1, le=12),
    starting_balance: float = Query(default=0.0),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    q = db.query(models.RecurringEntry).filter(models.RecurringEntry.active.is_(True))
    templates = _apply_visibility_filter(q, models.RecurringEntry, current_user).all()
    expected_income = round(sum(t.amount for t in templates if t.type == "income"), 2)
    expected_expenses = round(sum(t.amount for t in templates if t.type == "expense"), 2)
    net = round(expected_income - expected_expenses, 2)

    today = datetime.now(timezone.utc).date()
    cumulative = starting_balance
    results = []
    for i in range(months):
        year, month = _add_months(today.year, today.month, i)
        cumulative = round(cumulative + net, 2)
        results.append(
            schemas.ForecastMonth(
                year=year,
                month=month,
                label=f"{calendar.month_abbr[month]} {year}",
                expected_income=expected_income,
                expected_expenses=expected_expenses,
                net=net,
                cumulative_net=cumulative,
            )
        )
    return results


# ---------- Summary ----------


@app.get("/summary", response_model=schemas.Overview)
def summary(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    _generate_current_month(db)

    q_expenses = _apply_visibility_filter(db.query(func.sum(models.Expense.amount)), models.Expense, current_user)
    total_expenses = q_expenses.scalar() or 0.0

    income_totals = _income_by_source(db, current_user)
    total_income = income_totals.husband + income_totals.wife + income_totals.other
    settings = _get_settings(db, current_user)

    savings_actual = total_income - total_expenses
    remaining = savings_actual - settings.monthly_savings_goal

    return schemas.Overview(
        total_income=round(total_income, 2),
        income_by_source=income_totals,
        total_expenses=round(total_expenses, 2),
        savings_goal=settings.monthly_savings_goal,
        spending_limit=settings.monthly_spending_limit,
        remaining=round(remaining, 2),
        savings_actual=round(savings_actual, 2),
        on_track=savings_actual >= settings.monthly_savings_goal,
    )
