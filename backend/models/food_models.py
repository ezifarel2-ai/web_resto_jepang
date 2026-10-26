from pydantic import BaseModel, Field
from typing import List, Optional

class FoodItem(BaseModel):
    id: int
    name: str
    japanese_name: str = ""
    description: str
    price: int
    image_url: str
    category: str
    calories: int = 0
    prep_time_min: int = 10
    spiciness: int = 0  # 0 to 3
    is_vegetarian: bool = False
    is_halal: bool = True
    rating: float = 4.8
    review_count: int = 120
    tags: List[str] = []
    pairings: List[int] = []
    is_available: bool = True

class FoodCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Nama hidangan")
    japanese_name: Optional[str] = ""
    description: str = Field(..., min_length=5, description="Deskripsi hidangan")
    price: int = Field(..., gt=0, description="Harga dalam Rupiah")
    image_url: Optional[str] = ""
    category: str = Field(..., description="Kategori: Utama, Ramen, Sushi, Penutup, Minuman")
    calories: Optional[int] = 0
    prep_time_min: Optional[int] = 10
    spiciness: Optional[int] = 0
    is_vegetarian: Optional[bool] = False
    is_halal: Optional[bool] = True
    tags: Optional[List[str]] = []
    pairings: Optional[List[int]] = []
    is_available: Optional[bool] = True

class FoodUpdate(BaseModel):
    name: Optional[str] = None
    japanese_name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    calories: Optional[int] = None
    prep_time_min: Optional[int] = None
    spiciness: Optional[int] = None
    is_vegetarian: Optional[bool] = None
    is_halal: Optional[bool] = None
    tags: Optional[List[str]] = None
    pairings: Optional[List[int]] = None
    is_available: Optional[bool] = None
