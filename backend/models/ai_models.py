from pydantic import BaseModel, Field
from typing import List, Optional
from .food_models import FoodItem

class SmartComboRequest(BaseModel):
    budget: int = Field(..., examples=[100000], description="Maksimum budget dalam Rupiah")
    people_count: int = Field(1, examples=[2], description="Jumlah orang")
    preference: str = Field("all", examples=["gurih"], description="gurih, manis, pedas, ringan, sehat, all")
    is_halal: bool = True
    is_vegetarian: bool = False

class SmartComboResponse(BaseModel):
    combo_name: str
    description: str
    items: List[FoodItem]
    total_price: int
    budget: int
    savings: int
    total_calories: int
    taste_profile: str
