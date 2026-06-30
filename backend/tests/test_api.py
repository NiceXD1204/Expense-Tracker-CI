import os
from datetime import date

# Use an isolated SQLite DB for tests - must be set BEFORE importing the app
os.environ["DATABASE_URL"] = "sqlite:///./test_expenses.db"

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_health():
    with TestClient(app) as client:
        resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_create_expense_returns_201():
    with TestClient(app) as client:
        resp = client.post(
            "/expenses",
            json={"description": "pizza", "amount": 45.0, "category": "food"},
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["description"] == "pizza"
    assert body["amount"] == 45.0
    assert body["id"] == 1


def test_create_expense_with_missing_description_defaults_to_empty():
    with TestClient(app) as client:
        resp = client.post("/expenses", json={"amount": 45.0, "category": "food"})
    assert resp.status_code == 201
    assert resp.json()["description"] == ""


def test_create_expense_with_null_description_defaults_to_empty():
    with TestClient(app) as client:
        resp = client.post(
            "/expenses", json={"description": None, "amount": 45.0, "category": "food"}
        )
    assert resp.status_code == 201
    assert resp.json()["description"] == ""


def test_create_income_with_missing_description_defaults_to_empty():
    with TestClient(app) as client:
        resp = client.post("/income", json={"amount": 500, "source": "wife"})
    assert resp.status_code == 201
    assert resp.json()["description"] == ""


def test_create_rejects_negative_amount():
    with TestClient(app) as client:
        resp = client.post(
            "/expenses",
            json={"description": "bug", "amount": -5, "category": "food"},
        )
    assert resp.status_code == 422


def test_list_expenses():
    with TestClient(app) as client:
        client.post("/expenses", json={"description": "bus", "amount": 6, "category": "transport"})
        client.post("/expenses", json={"description": "pizza", "amount": 45, "category": "food"})
        resp = client.get("/expenses")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_delete_expense():
    with TestClient(app) as client:
        created = client.post(
            "/expenses", json={"description": "coffee", "amount": 12, "category": "food"}
        ).json()
        resp = client.delete(f"/expenses/{created['id']}")
        assert resp.status_code == 204
        assert client.get("/expenses").json() == []


def test_delete_missing_expense_returns_404():
    with TestClient(app) as client:
        resp = client.delete("/expenses/999")
    assert resp.status_code == 404


def test_create_rejects_unknown_category():
    with TestClient(app) as client:
        resp = client.post(
            "/expenses",
            json={"description": "mystery", "amount": 10, "category": "not_a_real_category"},
        )
    assert resp.status_code == 422


def test_create_accepts_new_categories():
    with TestClient(app) as client:
        resp = client.post(
            "/expenses",
            json={"description": "preschool fees", "amount": 1200, "category": "kindergarten"},
        )
    assert resp.status_code == 201
    assert resp.json()["category"] == "kindergarten"


def test_create_income_returns_201():
    with TestClient(app) as client:
        resp = client.post(
            "/income", json={"description": "salary", "amount": 5000, "source": "husband"}
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["description"] == "salary"
    assert body["source"] == "husband"


def test_create_income_rejects_unknown_source():
    with TestClient(app) as client:
        resp = client.post(
            "/income", json={"description": "mystery", "amount": 100, "source": "uncle"}
        )
    assert resp.status_code == 422


def test_list_and_delete_income():
    with TestClient(app) as client:
        created = client.post(
            "/income", json={"description": "freelance", "amount": 300, "source": "wife"}
        ).json()
        assert len(client.get("/income").json()) == 1
        resp = client.delete(f"/income/{created['id']}")
        assert resp.status_code == 204
        assert client.get("/income").json() == []


def test_delete_missing_income_returns_404():
    with TestClient(app) as client:
        resp = client.delete("/income/999")
    assert resp.status_code == 404


def test_income_summary_groups_by_source():
    with TestClient(app) as client:
        client.post("/income", json={"description": "salary", "amount": 5000, "source": "husband"})
        client.post("/income", json={"description": "bonus", "amount": 500, "source": "husband"})
        client.post("/income", json={"description": "salary", "amount": 4000, "source": "wife"})
        resp = client.get("/income/summary")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 9500.0
    assert body["by_source"] == {"husband": 5500.0, "wife": 4000.0, "other": 0.0}


def test_budget_settings_defaults_to_zero():
    with TestClient(app) as client:
        resp = client.get("/budget-settings")
    assert resp.status_code == 200
    assert resp.json() == {"monthly_savings_goal": 0.0, "monthly_spending_limit": 0.0}


def test_budget_settings_update_roundtrips():
    with TestClient(app) as client:
        resp = client.put(
            "/budget-settings",
            json={"monthly_savings_goal": 2000, "monthly_spending_limit": 6000},
        )
        assert resp.status_code == 200
        assert resp.json() == {"monthly_savings_goal": 2000.0, "monthly_spending_limit": 6000.0}
        assert client.get("/budget-settings").json() == {
            "monthly_savings_goal": 2000.0,
            "monthly_spending_limit": 6000.0,
        }


def test_summary_returns_overview():
    with TestClient(app) as client:
        client.post("/income", json={"description": "salary", "amount": 5000, "source": "husband"})
        client.post("/income", json={"description": "salary", "amount": 4000, "source": "wife"})
        client.post("/expenses", json={"description": "rent", "amount": 3000, "category": "rent_mortgage"})
        client.put("/budget-settings", json={"monthly_savings_goal": 2000, "monthly_spending_limit": 7000})
        resp = client.get("/summary")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_income"] == 9000.0
    assert body["income_by_source"] == {"husband": 5000.0, "wife": 4000.0, "other": 0.0}
    assert body["total_expenses"] == 3000.0
    assert body["savings_goal"] == 2000.0
    assert body["spending_limit"] == 7000.0
    assert body["savings_actual"] == 6000.0
    assert body["remaining"] == 4000.0
    assert body["on_track"] is True


# ---------- Feature: date field ----------


def test_create_expense_defaults_date_to_today():
    with TestClient(app) as client:
        resp = client.post("/expenses", json={"amount": 20, "category": "food"})
    assert resp.json()["date"] == date.today().isoformat()


def test_create_expense_accepts_explicit_past_date():
    with TestClient(app) as client:
        resp = client.post(
            "/expenses",
            json={"amount": 20, "category": "food", "date": "2026-01-15"},
        )
    assert resp.status_code == 201
    assert resp.json()["date"] == "2026-01-15"


# ---------- Feature: edit (PUT) ----------


def test_update_expense_changes_fields():
    with TestClient(app) as client:
        created = client.post(
            "/expenses", json={"description": "pizza", "amount": 45, "category": "food"}
        ).json()
        resp = client.put(
            f"/expenses/{created['id']}",
            json={"description": "sushi", "amount": 60, "category": "dining_out", "date": "2026-02-01"},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["description"] == "sushi"
    assert body["amount"] == 60.0
    assert body["category"] == "dining_out"
    assert body["date"] == "2026-02-01"


def test_update_expense_keeps_existing_value_when_field_omitted():
    with TestClient(app) as client:
        created = client.post(
            "/expenses", json={"description": "pizza", "amount": 45, "category": "food"}
        ).json()
        resp = client.put(f"/expenses/{created['id']}", json={"amount": 99})
    assert resp.status_code == 200
    body = resp.json()
    assert body["description"] == "pizza"
    assert body["category"] == "food"
    assert body["amount"] == 99.0


def test_update_missing_expense_returns_404():
    with TestClient(app) as client:
        resp = client.put("/expenses/999", json={"amount": 10})
    assert resp.status_code == 404


def test_update_income_changes_fields():
    with TestClient(app) as client:
        created = client.post(
            "/income", json={"description": "salary", "amount": 5000, "source": "husband"}
        ).json()
        resp = client.put(
            f"/income/{created['id']}",
            json={"description": "bonus", "amount": 1000, "source": "wife", "date": "2026-03-10"},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["description"] == "bonus"
    assert body["amount"] == 1000.0
    assert body["source"] == "wife"
    assert body["date"] == "2026-03-10"


def test_update_missing_income_returns_404():
    with TestClient(app) as client:
        resp = client.put("/income/999", json={"amount": 10})
    assert resp.status_code == 404


# ---------- Feature: recurring entries ----------


def test_create_recurring_expense_requires_category():
    with TestClient(app) as client:
        resp = client.post(
            "/recurring",
            json={"type": "expense", "amount": 4000, "day_of_month": 1},
        )
    assert resp.status_code == 422


def test_create_recurring_income_requires_source():
    with TestClient(app) as client:
        resp = client.post(
            "/recurring",
            json={"type": "income", "amount": 15000, "day_of_month": 15},
        )
    assert resp.status_code == 422


def test_recurring_day_of_month_out_of_range_rejected():
    with TestClient(app) as client:
        resp = client.post(
            "/recurring",
            json={"type": "expense", "amount": 100, "category": "rent_mortgage", "day_of_month": 31},
        )
    assert resp.status_code == 422


def test_recurring_crud_and_toggle_active():
    with TestClient(app) as client:
        created = client.post(
            "/recurring",
            json={
                "type": "expense",
                "description": "Rent",
                "amount": 4000,
                "category": "rent_mortgage",
                "day_of_month": 1,
            },
        ).json()
        assert created["active"] is True

        updated = client.put(
            f"/recurring/{created['id']}",
            json={
                "type": "expense",
                "description": "Rent",
                "amount": 4000,
                "category": "rent_mortgage",
                "day_of_month": 1,
                "active": False,
            },
        )
        assert updated.status_code == 200
        assert updated.json()["active"] is False

        assert len(client.get("/recurring").json()) == 1

        resp = client.delete(f"/recurring/{created['id']}")
        assert resp.status_code == 204
        assert client.get("/recurring").json() == []


def test_recurring_run_generates_transaction_and_is_idempotent():
    with TestClient(app) as client:
        client.post(
            "/recurring",
            json={
                "type": "income",
                "description": "Salary",
                "amount": 15000,
                "source": "husband",
                "day_of_month": 15,
            },
        )

        first_run = client.post("/recurring/run")
        assert first_run.status_code == 200
        assert first_run.json()["created"] == 1

        income_after_first_run = client.get("/income").json()
        assert len(income_after_first_run) == 1
        assert income_after_first_run[0]["recurring_id"] is not None

        second_run = client.post("/recurring/run")
        assert second_run.status_code == 200
        assert second_run.json()["created"] == 0

        # Still just one income row - running it twice did not duplicate it.
        assert len(client.get("/income").json()) == 1


def test_deleting_recurring_template_does_not_delete_generated_transactions():
    with TestClient(app) as client:
        template = client.post(
            "/recurring",
            json={
                "type": "expense",
                "description": "Rent",
                "amount": 4000,
                "category": "rent_mortgage",
                "day_of_month": 1,
            },
        ).json()
        client.post("/recurring/run")
        assert len(client.get("/expenses").json()) == 1

        client.delete(f"/recurring/{template['id']}")

        remaining = client.get("/expenses").json()
        assert len(remaining) == 1
        assert remaining[0]["recurring_id"] is None


def test_listing_expenses_auto_generates_current_month_recurring_entry():
    with TestClient(app) as client:
        client.post(
            "/recurring",
            json={
                "type": "expense",
                "description": "Rent",
                "amount": 4000,
                "category": "rent_mortgage",
                "day_of_month": 1,
            },
        )
        # No explicit /recurring/run call - GET /expenses should trigger generation itself.
        expenses = client.get("/expenses").json()
    assert len(expenses) == 1
    assert expenses[0]["recurring_id"] is not None


# ---------- Feature: subscriptions ----------


def test_subscriptions_totals_yearly_is_monthly_times_12():
    with TestClient(app) as client:
        client.post(
            "/recurring",
            json={
                "type": "expense",
                "description": "Netflix",
                "amount": 50,
                "category": "entertainment",
                "day_of_month": 5,
                "is_subscription": True,
            },
        )
        client.post(
            "/recurring",
            json={
                "type": "expense",
                "description": "Gym",
                "amount": 150,
                "category": "fitness",
                "day_of_month": 1,
                "is_subscription": True,
            },
        )
        resp = client.get("/subscriptions")
    assert resp.status_code == 200
    body = resp.json()
    assert body["summary"]["count"] == 2
    assert body["summary"]["monthly_total"] == 200.0
    assert body["summary"]["yearly_total"] == 2400.0
    assert body["summary"]["yearly_total"] == body["summary"]["monthly_total"] * 12


def test_subscriptions_excludes_non_subscription_and_inactive_and_income():
    with TestClient(app) as client:
        # Recurring expense, not flagged as a subscription
        client.post(
            "/recurring",
            json={
                "type": "expense",
                "description": "Rent",
                "amount": 4000,
                "category": "rent_mortgage",
                "day_of_month": 1,
                "is_subscription": False,
            },
        )
        # Inactive subscription
        client.post(
            "/recurring",
            json={
                "type": "expense",
                "description": "Old gym",
                "amount": 99,
                "category": "fitness",
                "day_of_month": 1,
                "is_subscription": True,
                "active": False,
            },
        )
        # Recurring income flagged is_subscription (shouldn't be possible via
        # the UI, but the API must still only return type=expense)
        client.post(
            "/recurring",
            json={
                "type": "income",
                "description": "Salary",
                "amount": 5000,
                "source": "husband",
                "day_of_month": 1,
            },
        )
        resp = client.get("/subscriptions")
    assert resp.status_code == 200
    assert resp.json()["summary"] == {"monthly_total": 0.0, "yearly_total": 0.0, "count": 0}


# ---------- Feature: net worth ----------


def test_accounts_crud():
    with TestClient(app) as client:
        created = client.post(
            "/accounts", json={"name": "Checking", "type": "asset", "balance": 5000, "category": "cash"}
        ).json()
        assert created["balance"] == 5000.0

        updated = client.put(
            f"/accounts/{created['id']}",
            json={"name": "Checking", "type": "asset", "balance": 5500, "category": "cash"},
        )
        assert updated.status_code == 200
        assert updated.json()["balance"] == 5500.0

        assert len(client.get("/accounts").json()) == 1

        resp = client.delete(f"/accounts/{created['id']}")
        assert resp.status_code == 204
        assert client.get("/accounts").json() == []


def test_update_missing_account_returns_404():
    with TestClient(app) as client:
        resp = client.put(
            "/accounts/999", json={"name": "x", "type": "asset", "balance": 1, "category": None}
        )
    assert resp.status_code == 404


def test_networth_is_assets_minus_liabilities():
    with TestClient(app) as client:
        client.post("/accounts", json={"name": "Checking", "type": "asset", "balance": 5000, "category": "cash"})
        client.post("/accounts", json={"name": "Savings", "type": "asset", "balance": 10000, "category": "cash"})
        client.post(
            "/accounts", json={"name": "Mortgage", "type": "liability", "balance": 8000, "category": "loan"}
        )
        resp = client.get("/accounts/networth")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_assets"] == 15000.0
    assert body["total_liabilities"] == 8000.0
    assert body["net_worth"] == 7000.0


# ---------- Feature: cash flow forecast ----------


def test_forecast_returns_requested_number_of_months():
    with TestClient(app) as client:
        resp = client.get("/forecast?months=6")
    assert resp.status_code == 200
    assert len(resp.json()) == 6


def test_forecast_rejects_out_of_range_months():
    with TestClient(app) as client:
        resp = client.get("/forecast?months=13")
    assert resp.status_code == 422


def test_forecast_cumulative_net_math():
    with TestClient(app) as client:
        client.post(
            "/recurring",
            json={"type": "income", "description": "Salary", "amount": 10000, "source": "husband", "day_of_month": 1},
        )
        client.post(
            "/recurring",
            json={"type": "expense", "description": "Rent", "amount": 4000, "category": "rent_mortgage", "day_of_month": 1},
        )
        resp = client.get("/forecast?months=3&starting_balance=1000")
    assert resp.status_code == 200
    body = resp.json()
    # net = 10000 - 4000 = 6000/month
    assert [m["net"] for m in body] == [6000.0, 6000.0, 6000.0]
    assert [m["cumulative_net"] for m in body] == [7000.0, 13000.0, 19000.0]
    assert all(m["expected_income"] == 10000.0 for m in body)
    assert all(m["expected_expenses"] == 4000.0 for m in body)


def test_forecast_does_not_create_real_transactions():
    # Checked via a direct DB query rather than GET /expenses, since that
    # route triggers its own generation - the point here is that /forecast
    # itself must never create rows.
    from app import models
    from app.database import SessionLocal

    with TestClient(app) as client:
        client.post(
            "/recurring",
            json={"type": "expense", "description": "Rent", "amount": 4000, "category": "rent_mortgage", "day_of_month": 1},
        )
        client.get("/forecast?months=6")

        db = SessionLocal()
        try:
            assert db.query(models.Expense).count() == 0
        finally:
            db.close()
