from enum import Enum


class RecurringType(str, Enum):
    EXPENSE = "expense"
    INCOME = "income"
