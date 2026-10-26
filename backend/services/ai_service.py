"""
Service untuk logika Rekomendasi Menu (Pairing) dan Smart Budget Optimizer.
"""

import ai_engine

def generate_combo(budget: int, people_count: int, preference: str, is_halal: bool, is_vegetarian: bool):
    return ai_engine.generate_smart_combo(
        budget=budget,
        people_count=people_count,
        preference=preference,
        is_halal=is_halal,
        is_vegetarian=is_vegetarian
    )

def get_recommendations(food_ids: list, limit: int = 3):
    return ai_engine.get_smart_recommendations(food_ids, limit=limit)
