from enum import Enum


class AccountType(str, Enum):
    ASSET = "asset"
    LIABILITY = "liability"
