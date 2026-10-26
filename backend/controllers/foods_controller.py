from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from models.food_models import FoodItem, FoodCreate, FoodUpdate
import db
import ai_engine

router = APIRouter(prefix="/api/foods", tags=["Foods & Menu"])

@router.get("", response_model=List[FoodItem])
def get_foods(
    query: str = "",
    category: str = "",
    max_price: Optional[int] = None,
    is_halal: Optional[bool] = None,
    is_vegetarian: Optional[bool] = None,
    is_spicy: Optional[bool] = None,
    sort_by: str = "popular",
    include_unavailable: bool = Query(False, description="Tampilkan juga hidangan yang sedang habis")
):
    """
    Mengambil daftar makanan dengan dukungan filter cerdas:
    query, kategori, harga maksimum, halal, vegetarian, kepedasan, dan ketersediaan.
    """
    if include_unavailable:
        return db.get_db_foods(
            query=query,
            category=category,
            max_price=max_price,
            is_halal=is_halal,
            is_vegetarian=is_vegetarian,
            is_spicy=is_spicy,
            sort_by=sort_by,
            include_unavailable=True
        )

    return ai_engine.get_all_foods(
        query=query,
        category=category,
        max_price=max_price,
        is_halal=is_halal,
        is_vegetarian=is_vegetarian,
        is_spicy=is_spicy,
        sort_by=sort_by
    )

@router.get("/{food_id}", response_model=FoodItem)
def get_food_detail(food_id: int):
    """Mengambil detail lengkap satu hidangan beserta informasi pairing."""
    food = ai_engine.get_food_by_id(food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")
    return food

@router.post("", response_model=FoodItem, status_code=status.HTTP_201_CREATED)
def create_food(payload: FoodCreate):
    """Menambahkan menu hidangan baru ke restoran."""
    try:
        created = db.create_db_food(payload.model_dump())
        if not created:
            raise HTTPException(status_code=500, detail="Gagal menyimpan menu ke database")
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan: {str(e)}")

@router.put("/{food_id}", response_model=FoodItem)
def update_food(food_id: int, payload: FoodUpdate):
    """Memperbarui informasi hidangan yang sudah ada."""
    updated = db.update_db_food(food_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan untuk diperbarui")
    return updated

@router.patch("/{food_id}/availability")
def toggle_food_status(food_id: int, is_available: Optional[bool] = None):
    """Mengubah status ketersediaan hidangan (Tersedia / Habis)."""
    new_status = db.toggle_food_availability(food_id, is_available)
    if new_status is None:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan")
    return {
        "status": "success",
        "food_id": food_id,
        "is_available": new_status,
        "message": "Status menu diubah menjadi " + ("Tersedia" if new_status else "Habis / Sold Out")
    }

@router.delete("/{food_id}")
def delete_food(food_id: int):
    """Menghapus hidangan dari katalog menu."""
    deleted = db.delete_db_food(food_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Menu tidak ditemukan atau sudah dihapus")
    return {
        "status": "success",
        "food_id": food_id,
        "message": "Hidangan berhasil dihapus dari sistem"
    }
