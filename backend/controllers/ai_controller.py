from typing import List
from fastapi import APIRouter, Query
from models.food_models import FoodItem
from models.ai_models import SmartComboRequest, SmartComboResponse
import services.ai_service as ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Recommendation & Budget Optimizer"])

@router.post("/smart-combo", response_model=SmartComboResponse)
def get_smart_combo(request: SmartComboRequest):
    """
    Algoritma Optimasi Menu Berbasis Budget & Preferensi:
    Mengkombinasikan hidangan utama, minuman, dan camilan/penutup
    yang paling harmonis dan bernilai tinggi dalam batas anggaran.
    """
    result = ai_service.generate_combo(
        budget=request.budget,
        people_count=request.people_count,
        preference=request.preference,
        is_halal=request.is_halal,
        is_vegetarian=request.is_vegetarian
    )
    return SmartComboResponse(**result)

@router.get("/recommendations", response_model=List[FoodItem])
def get_pairings(food_ids: str = Query("", description="Daftar ID makanan dipisahkan koma, misal: 1,3")):
    """Mendapatkan rekomendasi pairing cerdas untuk hidangan yang sedang dilihat atau di keranjang."""
    parsed_ids = []
    if food_ids:
        try:
            parsed_ids = [int(i.strip()) for i in food_ids.split(",") if i.strip().isdigit()]
        except ValueError:
            parsed_ids = []
    
    return ai_service.get_recommendations(parsed_ids, limit=3)
