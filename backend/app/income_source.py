from enum import Enum


class IncomeSource(str, Enum):
    HUSBAND = "husband"
    WIFE = "wife"
    OTHER = "other"
