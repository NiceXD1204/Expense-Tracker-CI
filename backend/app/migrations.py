"""Tiny additive-only schema migration helper.

`Base.metadata.create_all()` (used in main.py's lifespan) only creates tables
that don't exist yet - it never adds new columns to a table that's already
there. This module does the one thing that needs doing by hand: add
newly-introduced columns to already-existing tables, then backfill sensible
values into them, so existing local/docker-compose data keeps working after a
model change.
"""

from datetime import datetime, timezone

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

_NEW_COLUMNS = {
    "users": [
        ("security_question", "VARCHAR(200)"),
        ("security_answer_hash", "VARCHAR(255)"),
        ("first_name", "VARCHAR(100)"),
        ("last_name", "VARCHAR(100)"),
        ("avatar_data", "TEXT"),
        ("household_joined_at", "TIMESTAMP"),
        ("can_view_history", "BOOLEAN"),
    ],
    "expenses": [
        ("date", "DATE"),
        ("recurring_id", "INTEGER"),
        ("user_id", "INTEGER"),
        ("household_id", "INTEGER"),
    ],
    "income": [
        ("date", "DATE"),
        ("recurring_id", "INTEGER"),
        ("user_id", "INTEGER"),
        ("household_id", "INTEGER"),
    ],
    "recurring_entries": [
        ("is_subscription", "BOOLEAN"),
        ("user_id", "INTEGER"),
        ("household_id", "INTEGER"),
    ],
    "budget_settings": [
        ("user_id", "INTEGER"),
        ("household_id", "INTEGER"),
    ],
    "accounts": [
        ("user_id", "INTEGER"),
        ("household_id", "INTEGER"),
    ],
}


def ensure_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table, columns in _NEW_COLUMNS.items():
            if table not in existing_tables:
                continue  # brand-new table - create_all() below adds it with every column
            existing_columns = {c["name"] for c in inspector.get_columns(table)}
            for name, col_type in columns:
                if name not in existing_columns:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {col_type}"))


def backfill_dates(session_factory, models) -> None:
    """Give any pre-existing row (inserted before the `date` column existed)
    a sensible `date` derived from its `created_at`, instead of leaving it NULL
    and silently disappearing from month-based filtering."""
    db = session_factory()
    try:
        changed = False
        for model in (models.Expense, models.Income):
            rows = db.query(model).filter(model.date.is_(None)).all()
            for row in rows:
                created = row.created_at
                if created is not None:
                    if created.tzinfo is None:
                        created = created.replace(tzinfo=timezone.utc)
                    row.date = created.astimezone(timezone.utc).date()
                else:
                    row.date = datetime.now(timezone.utc).date()
                changed = True
        if changed:
            db.commit()
    finally:
        db.close()


def backfill_subscription_flag(session_factory, models) -> None:
    """ALTER TABLE ... ADD COLUMN leaves existing rows NULL even though the
    model declares a default - give pre-existing recurring entries an
    explicit False instead of leaving is_subscription NULL."""
    db = session_factory()
    try:
        rows = db.query(models.RecurringEntry).filter(models.RecurringEntry.is_subscription.is_(None)).all()
        for row in rows:
            row.is_subscription = False
        if rows:
            db.commit()
    finally:
        db.close()


def backfill_household_history_access(session_factory, models) -> None:
    """Give every pre-existing user an explicit can_view_history (default
    True - they already had full access before this feature existed) instead
    of leaving it NULL, and a best-guess household_joined_at (their account
    created_at) for anyone already in a household, so the creator can
    meaningfully restrict their history access later instead of the toggle
    silently doing nothing for lack of a join date."""
    db = session_factory()
    try:
        changed = False
        for row in db.query(models.User).filter(models.User.can_view_history.is_(None)).all():
            row.can_view_history = True
            changed = True
        for row in db.query(models.User).filter(
            models.User.household_id.isnot(None),
            models.User.household_joined_at.is_(None),
        ).all():
            row.household_joined_at = row.created_at
            changed = True
        if changed:
            db.commit()
    finally:
        db.close()
