import calendar
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Query
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas
from .database import SessionLocal, engine, get_db
from .migrations import backfill_dates, backfill_subscription_flag, ensure_schema


def generate_recurring_for_month(db: Session, year: int, month: int) -> int:
    """Create the real Expense/Income row for every active recurring template
    for the given month, unless one already exists for it (matched via
    recurring_id + falling within that month) - safe to call repeatedly."""
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
    # Additive schema patch + backfill for tables that already existed before
    # the `date`/`recurring_id` columns were introduced (create_all() never
    # alters existing tables - see migrations.py).
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

# Exposes /metrics for Prometheus (scraped via the backend chart's ServiceMonitor).
Instrumentator().instrument(app).expose(app)


def _get_settings(db: Session) -> models.BudgetSettings:
    settings = db.query(models.BudgetSettings).first()
    if settings is None:
        settings = models.BudgetSettings(monthly_savings_goal=0.0, monthly_spending_limit=0.0)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def _income_by_source(db: Session) -> schemas.IncomeBySource:
    rows = (
        db.query(models.Income.source, func.sum(models.Income.amount))
        .group_by(models.Income.source)
        .all()
    )
    totals = {"husband": 0.0, "wife": 0.0, "other": 0.0}
    for source, total in rows:
        key = source if source in totals else "other"
        totals[key] += total or 0.0
    return schemas.IncomeBySource(
        husband=round(totals["husband"], 2),
        wife=round(totals["wife"], 2),
        other=round(totals["other"], 2),
    )


@app.get("/healthz")
def health():
    """Used by Kubernetes liveness/readiness probes."""
    return {"status": "ok"}


# ---------- Expenses ----------


@app.get("/expenses", response_model=list[schemas.ExpenseOut])
def list_expenses(db: Session = Depends(get_db)):
    _generate_current_month(db)
    return db.query(models.Expense).order_by(models.Expense.date.desc(), models.Expense.created_at.desc()).all()


@app.post("/expenses", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    data = expense.model_dump()
    if data.get("date") is None:
        data["date"] = datetime.now(timezone.utc).date()
    db_expense = models.Expense(**data)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(expense_id: int, payload: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
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
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()


# ---------- Income ----------


@app.get("/income", response_model=list[schemas.IncomeOut])
def list_income(db: Session = Depends(get_db)):
    _generate_current_month(db)
    return db.query(models.Income).order_by(models.Income.date.desc(), models.Income.created_at.desc()).all()


@app.post("/income", response_model=schemas.IncomeOut, status_code=201)
def create_income(income: schemas.IncomeCreate, db: Session = Depends(get_db)):
    data = income.model_dump()
    if data.get("date") is None:
        data["date"] = datetime.now(timezone.utc).date()
    db_income = models.Income(**data)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income


@app.put("/income/{income_id}", response_model=schemas.IncomeOut)
def update_income(income_id: int, payload: schemas.IncomeUpdate, db: Session = Depends(get_db)):
    income = db.get(models.Income, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail="Income not found")
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
def delete_income(income_id: int, db: Session = Depends(get_db)):
    income = db.get(models.Income, income_id)
    if income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    db.delete(income)
    db.commit()


@app.get("/income/summary", response_model=schemas.IncomeSummary)
def income_summary(db: Session = Depends(get_db)):
    by_source = _income_by_source(db)
    total = round(by_source.husband + by_source.wife + by_source.other, 2)
    return schemas.IncomeSummary(total=total, by_source=by_source)


# ---------- Budget settings (single config row) ----------


@app.get("/budget-settings", response_model=schemas.BudgetSettingsOut)
def get_budget_settings(db: Session = Depends(get_db)):
    return _get_settings(db)


@app.put("/budget-settings", response_model=schemas.BudgetSettingsOut)
def update_budget_settings(payload: schemas.BudgetSettingsUpdate, db: Session = Depends(get_db)):
    settings = _get_settings(db)
    settings.monthly_savings_goal = payload.monthly_savings_goal
    settings.monthly_spending_limit = payload.monthly_spending_limit
    db.commit()
    db.refresh(settings)
    return settings


# ---------- Recurring entries ----------


@app.get("/recurring", response_model=list[schemas.RecurringOut])
def list_recurring(db: Session = Depends(get_db)):
    return db.query(models.RecurringEntry).order_by(models.RecurringEntry.created_at.desc()).all()


@app.post("/recurring", response_model=schemas.RecurringOut, status_code=201)
def create_recurring(payload: schemas.RecurringCreate, db: Session = Depends(get_db)):
    entry = models.RecurringEntry(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@app.put("/recurring/{recurring_id}", response_model=schemas.RecurringOut)
def update_recurring(recurring_id: int, payload: schemas.RecurringUpdate, db: Session = Depends(get_db)):
    entry = db.get(models.RecurringEntry, recurring_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Recurring entry not found")
    for key, value in payload.model_dump().items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)
    return entry


@app.delete("/recurring/{recurring_id}", status_code=204)
def delete_recurring(recurring_id: int, db: Session = Depends(get_db)):
    entry = db.get(models.RecurringEntry, recurring_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Recurring entry not found")
    # The transactions this template already generated become standalone
    # entries instead of being cascade-deleted along with the template.
    db.query(models.Expense).filter(models.Expense.recurring_id == recurring_id).update({"recurring_id": None})
    db.query(models.Income).filter(models.Income.recurring_id == recurring_id).update({"recurring_id": None})
    db.delete(entry)
    db.commit()


@app.post("/recurring/run")
def run_recurring(db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    created = generate_recurring_for_month(db, today.year, today.month)
    return {"created": created}


# ---------- Subscriptions (recurring expenses flagged is_subscription) ----------


@app.get("/subscriptions", response_model=schemas.SubscriptionsOut)
def list_subscriptions(db: Session = Depends(get_db)):
    items = (
        db.query(models.RecurringEntry)
        .filter(
            models.RecurringEntry.type == "expense",
            models.RecurringEntry.is_subscription.is_(True),
            models.RecurringEntry.active.is_(True),
        )
        .order_by(models.RecurringEntry.amount.desc())
        .all()
    )
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


# ---------- Accounts (net worth tracking) ----------


@app.get("/accounts", response_model=list[schemas.AccountOut])
def list_accounts(db: Session = Depends(get_db)):
    return db.query(models.Account).order_by(models.Account.created_at.desc()).all()


@app.post("/accounts", response_model=schemas.AccountOut, status_code=201)
def create_account(payload: schemas.AccountCreate, db: Session = Depends(get_db)):
    account = models.Account(**payload.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@app.put("/accounts/{account_id}", response_model=schemas.AccountOut)
def update_account(account_id: int, payload: schemas.AccountUpdate, db: Session = Depends(get_db)):
    account = db.get(models.Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    for key, value in payload.model_dump().items():
        setattr(account, key, value)
    db.commit()
    db.refresh(account)
    return account


@app.delete("/accounts/{account_id}", status_code=204)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.get(models.Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()


@app.get("/accounts/networth", response_model=schemas.NetWorthSummary)
def get_net_worth(db: Session = Depends(get_db)):
    total_assets = db.query(func.sum(models.Account.balance)).filter(models.Account.type == "asset").scalar() or 0.0
    total_liabilities = (
        db.query(func.sum(models.Account.balance)).filter(models.Account.type == "liability").scalar() or 0.0
    )
    return schemas.NetWorthSummary(
        total_assets=round(total_assets, 2),
        total_liabilities=round(total_liabilities, 2),
        net_worth=round(total_assets - total_liabilities, 2),
    )


# ---------- Cash flow forecast (read-only projection, never generates real rows) ----------


def _add_months(year: int, month: int, offset: int) -> tuple[int, int]:
    total = (year * 12 + (month - 1)) + offset
    return total // 12, total % 12 + 1


@app.get("/forecast", response_model=list[schemas.ForecastMonth])
def forecast(
    months: int = Query(default=6, ge=1, le=12),
    starting_balance: float = Query(default=0.0),
    db: Session = Depends(get_db),
):
    templates = db.query(models.RecurringEntry).filter(models.RecurringEntry.active.is_(True)).all()
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


# ---------- Overview ----------


@app.get("/summary", response_model=schemas.Overview)
def summary(db: Session = Depends(get_db)):
    _generate_current_month(db)

    total_expenses = db.query(func.sum(models.Expense.amount)).scalar() or 0.0
    income_totals = _income_by_source(db)
    total_income = income_totals.husband + income_totals.wife + income_totals.other
    settings = _get_settings(db)

    savings_actual = total_income - total_expenses
    remaining = total_income - total_expenses - settings.monthly_savings_goal

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
