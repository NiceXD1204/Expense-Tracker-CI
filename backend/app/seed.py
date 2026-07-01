"""Create tables and seed a demo user + sample data if the database is empty.

Run as a one-off Helm hook Job (`pre-install,pre-upgrade`) so the app starts
with some demo data: `python -m app.seed`.

Demo credentials:
  Email:    demo@example.com
  Password: demo1234
"""

from datetime import date

from . import models
from .auth import hash_password
from .database import Base, SessionLocal, engine

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demo1234"
DEMO_NAME = "Demo User"

SAMPLE_EXPENSES = [
    {"description": "Groceries", "amount": 54.30, "category": "Food", "date": date.today().isoformat()},
    {"description": "Bus pass", "amount": 25.00, "category": "Transport", "date": date.today().isoformat()},
    {"description": "Electricity bill", "amount": 80.15, "category": "Utilities", "date": date.today().isoformat()},
]

SAMPLE_INCOME = [
    {"description": "Monthly salary", "amount": 3000.00, "source": "salary", "date": date.today().isoformat()},
]


def main() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Skip entirely if any user already exists (real data present)
        if db.query(models.User).count() > 0:
            print("Users table already has data, skipping seed.")
            return

        # Create demo user
        demo_user = models.User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            display_name=DEMO_NAME,
        )
        db.add(demo_user)
        db.flush()  # get demo_user.id before commit

        # Seed expenses owned by demo user
        db.add_all(
            models.Expense(**row, user_id=demo_user.id)
            for row in SAMPLE_EXPENSES
        )

        # Seed income owned by demo user
        db.add_all(
            models.Income(**row, user_id=demo_user.id)
            for row in SAMPLE_INCOME
        )

        db.commit()
        print(f"Seeded demo user ({DEMO_EMAIL}) with {len(SAMPLE_EXPENSES)} expenses and {len(SAMPLE_INCOME)} income entries.")
        print(f"  Login: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
