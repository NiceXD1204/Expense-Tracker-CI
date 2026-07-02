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


# ---------- Auth schemas ----------


class UserRegister(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6)
    display_name: str = Field(default="", max_length=100)
    security_question: Optional[str] = Field(default=None, max_length=200)
    security_answer: Optional[str] = Field(default=None, max_length=200)


class UserLogin(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    display_name: str
    household_id: Optional[int] = None
    security_question: Optional[str] = None
    created_at: datetime


class ForgotPasswordQuestion(BaseModel):
    email: str


class ForgotPasswordReset(BaseModel):
    email: str
    answer: str = Field(..., min_length=1, max_length=200)
    new_password: str = Field(..., min_length=6)


# ---------- Household schemas ----------


class HouseholdCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)


class HouseholdJoin(BaseModel):
    invite_code: str


class HouseholdMember(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    display_name: str


class HouseholdOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    invite_code: str
    created_by: int
    members: list[HouseholdMember] = []


# ---------- Expenses ----------


class ExpenseCreate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    description: Optional[str] = Field(default="", max_length=200)
    amount: float = Field(..., gt=0)
    category: Category
    date: Optional[date_type] = None
    is_shared: bool = False

    @field_validator("description", mode="before")
    @classmethod
    def _default_empty_description(cls, value):
        return _default_empty(value)


class ExpenseUpdate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    description: Optional[str] = Field(default=None, max_length=200)
    amount: float = Field(..., gt=0)
    category: Optional[Category] = None
    date: Optional[date_type] = None


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    amount: float
    category: str
    date: date_type
    recurring_id: Optional[int] = None
    user_id: Optional[int] = None
    household_id: Optional[int] = None
    created_at: datetime

    @property
    def is_shared(self) -> bool:
        return self.household_id is not None


# ---------- Income ----------


class IncomeCreate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    description: Optional[str] = Field(default="", max_length=200)
    amount: float = Field(..., gt=0)
    source: IncomeSource
    date: Optional[date_type] = None
    is_shared: bool = False

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
    source: str
    date: date_type
    recurring_id: Optional[int] = None
    user_id: Optional[int] = None
    household_id: Optional[int] = None
    created_at: datetime


class IncomeBySource(BaseModel):
    husband: float
    wife: float
    other: float


class IncomeSummary(BaseModel):
    total: float
    by_source: IncomeBySource


# ---------- Budget settings ----------


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


# ---------- Recurring entries ----------


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
    is_shared: bool = False

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


class RecurringUpdate(BaseModel):
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
    user_id: Optional[int] = None
    household_id: Optional[int] = None
    created_at: datetime


class SubscriptionsSummary(BaseModel):
    monthly_total: float
    yearly_total: float
    count: int


class SubscriptionsOut(BaseModel):
    items: list[RecurringOut]
    summary: SubscriptionsSummary


# ---------- Accounts ----------


class AccountCreate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    name: str = Field(..., min_length=1, max_length=100)
    type: AccountType
    balance: float = Field(..., ge=0)
    category: Optional[str] = Field(default=None, max_length=50)
    is_shared: bool = False


class AccountUpdate(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    name: str = Field(..., min_length=1, max_length=100)
    type: AccountType
    balance: float = Field(..., ge=0)
    category: Optional[str] = Field(default=None, max_length=50)


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    balance: float
    category: Optional[str] = None
    user_id: Optional[int] = None
    household_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class NetWorthSummary(BaseModel):
    total_assets: float
    total_liabilities: float
    net_worth: float


# ---------- Forecast ----------


class ForecastMonth(BaseModel):
    year: int
    month: int
    label: str
    expected_income: float
    expected_expenses: float
    net: float
    cumulative_net: float
