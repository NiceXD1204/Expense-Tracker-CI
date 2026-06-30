"""Allowed expense categories.

Mirrors the frontend's CATEGORY_META (frontend/src/constants/categories.js).
Keep both in sync when adding/removing a category.
"""

from enum import Enum


class Category(str, Enum):
    # Original
    FOOD = "food"
    BILLS = "bills"
    HEALTH = "health"
    ENTERTAINMENT = "entertainment"
    TRANSPORT = "transport"
    OTHER = "other"

    # Original requested (round 2)
    KINDERGARTEN = "kindergarten"
    SCHOOL = "school"
    BABYSITTER = "babysitter"
    WATER = "water"
    ELECTRICITY = "electricity"
    PROPERTY_TAX = "property_tax"
    REPAIRS = "repairs"
    CAR = "car"
    FUEL = "fuel"
    CAR_INSURANCE = "car_insurance"
    FAMILY_EVENTS = "family_events"

    # Home & living
    RENT_MORTGAGE = "rent_mortgage"
    BUILDING_MAINTENANCE = "building_maintenance"
    GAS = "gas"
    INTERNET_TV = "internet_tv"
    HOME_GOODS = "home_goods"

    # Kids & education
    ACTIVITIES = "activities"
    KIDS_CLOTHING = "kids_clothing"
    TOYS = "toys"

    # Food
    GROCERIES = "groceries"
    DINING_OUT = "dining_out"

    # Transport
    PUBLIC_TRANSPORT = "public_transport"
    PARKING_TOLLS = "parking_tolls"

    # Health
    HEALTH_INSURANCE = "health_insurance"
    PHARMACY = "pharmacy"
    DENTAL = "dental"

    # Personal & leisure
    CLOTHING = "clothing"
    SUBSCRIPTIONS = "subscriptions"
    FITNESS = "fitness"
    GIFTS = "gifts"
    TRAVEL = "travel"

    # Finance
    SAVINGS = "savings"
    BANK_FEES = "bank_fees"
    LOANS = "loans"
