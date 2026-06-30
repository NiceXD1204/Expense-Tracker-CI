from datetime import date as date_type
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .account_type import AccountType
from .categories import Category
from .income_source import IncomeSource
from .recurring_type import RecurringType


def _default_empty(value):
    return value if value is not None else ""


class ExpenseCreate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    description: Optional[str] = Field(default="", max_length=200)
    amount: float = Field(..., gt=0)
    category: Category
    # If omitted, the route defaults this to today's date.
    date: Optional[date_type] = None

    @field_validator("description", mode="before")
    @classmethod
    def _default_empty_description(cls, value):
        return _default_empty(value)


class ExpenseUpdate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    # Only amount is required on edit - omitted fields keep their current value.
    description: Optional[str] = Field(default=None, max_length=200)
    amount: float = Field(..., gt=0)
    category: Optional[Category] = None
    date: Optional[date_type] = None


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    amount: float
    # Plain str (not Category) so rows with an older/unlisted category value
    # already in the database can still be read back instead of failing validation.
    category: str
    date: date_type
    recurring_id: Optional[int] = None
    created_at: datetime


class IncomeCreate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    description: Optional[str] = Field(default="", max_length=200)
    amount: float = Field(..., gt=0)
    source: IncomeSource
    date: Optional[date_type] = None

    @field_validator("description", mode="before")
    @classmethod
    def _default_empty_description(cls, value):
        return _default_empty(value)


class IncomeUpdate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    description: Optional[str] = Field(default=None, max_length=200)
    amount: float = Field(..., gt=0)
    source: Optional[IncomeSource] = None
    date: Optional[date_type] = None


class IncomeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    amount: float
    # Plain str, same reasoning as ExpenseOut.category above.
    source: str
    date: date_type
    recurring_id: Optional[int] = None
    created_at: datetime


class IncomeBySource(BaseModel):
    husband: float
    wife: float
    other: float


class IncomeSummary(BaseModel):
    total: float
    by_source: IncomeBySource


class BudgetSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    monthly_savings_goal: float
    monthly_spending_limit: float


class BudgetSettingsUpdate(BaseModel):
    monthly_savings_goal: float = Field(..., ge=0)
    monthly_spending_limit: float = Field(..., ge=0)


class Overview(BaseModel):
    total_income: float
    income_by_source: IncomeBySource
    total_expenses: float
    savings_goal: float
    spending_limit: float
    remaining: float
    savings_actual: float
    on_track: bool


class RecurringCreate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    type: RecurringType
    description: Optional[str] = Field(default="", max_length=200)
    amount: float = Field(..., gt=0)
    category: Optional[Category] = None
    source: Optional[IncomeSource] = None
    day_of_month: int = Field(..., ge=1, le=28)
    active: bool = True
    is_subscription: bool = False

    @field_validator("description", mode="before")
    @classmethod
    def _default_empty_description(cls, value):
        return _default_empty(value)

    @model_validator(mode="after")
    def _require_category_or_source(self):
        if self.type == "expense" and not self.category:
            raise ValueError("category is required when type is 'expense'")
        if self.type == "income" and not self.source:
            raise ValueError("source is required when type is 'income'")
        return self


class RecurringUpdate(RecurringCreate):
    pass


class RecurringOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    description: str
    amount: float
    category: Optional[str] = None
    source: Optional[str] = None
    day_of_month: int
    active: bool
    is_subscription: bool
    created_at: datetime


class SubscriptionsSummary(BaseModel):
    monthly_total: float
    yearly_total: float
    count: int


class SubscriptionsOut(BaseModel):
    items: list[RecurringOut]
    summary: SubscriptionsSummary


class AccountCreate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    name: str = Field(..., min_length=1, max_length=100)
    type: AccountType
    balance: float = Field(..., ge=0)
    category: Optional[str] = Field(default=None, max_length=50)


class AccountUpdate(AccountCreate):
    pass


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    balance: float
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class NetWorthSummary(BaseModel):
    total_assets: float
    total_liabilities: float
    net_worth: float


class ForecastMonth(BaseModel):
    year: int
    month: int
    label: str
    expected_income: float
    expected_expenses: float
    net: float
    cumulative_net: float
