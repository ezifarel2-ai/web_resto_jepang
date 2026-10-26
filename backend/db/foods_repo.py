import sqlite3
import json
from typing import List, Dict, Any, Optional
from .connection import get_connection

def format_food_row(row: Any) -> Dict[str, Any]:
    """Helper untuk mengonversi row database foods ke dictionary Python."""
    item = dict(row)
    item["is_vegetarian"] = bool(item["is_vegetarian"])
    item["is_halal"] = bool(item["is_halal"])
    item["is_available"] = bool(item.get("is_available", 1))
    
    # Parse JSON tags & pairings
    try:
        item["tags"] = json.loads(item.get("tags") or "[]")
    except Exception:
        item["tags"] = []

    try:
        item["pairings"] = json.loads(item.get("pairings") or "[]")
    except Exception:
        item["pairings"] = []

    return item

def get_db_foods(
    query: str = "",
    category: str = "",
    max_price: Optional[int] = None,
    is_halal: Optional[bool] = None,
    is_vegetarian: Optional[bool] = None,
    is_spicy: Optional[bool] = None,
    sort_by: str = "popular",
    include_unavailable: bool = False
) -> List[Dict[str, Any]]:
    """Mengambil daftar hidangan langsung dari database dengan filter dinamis."""
    conn = get_connection()
    cursor = conn.cursor()

    conditions: List[str] = []
    if not include_unavailable:
        conditions.append("is_available = 1")
    params: List[Any] = []

    if query.strip():
        q = f"%{query.strip().lower()}%"
        conditions.append("(LOWER(name) LIKE ? OR LOWER(japanese_name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(tags) LIKE ?)")
        params.extend([q, q, q, q])

    if category.strip():
        conditions.append("category = ?")
        params.append(category.strip())

    if max_price is not None:
        conditions.append("price <= ?")
        params.append(max_price)

    if is_halal is not None:
        conditions.append("is_halal = ?")
        params.append(1 if is_halal else 0)

    if is_vegetarian is not None:
        conditions.append("is_vegetarian = ?")
        params.append(1 if is_vegetarian else 0)

    if is_spicy is not None:
        if is_spicy:
            conditions.append("spiciness > 0")
        else:
            conditions.append("spiciness = 0")

    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""

    # Sorting
    if sort_by == "price_asc":
        order_clause = " ORDER BY price ASC"
    elif sort_by == "price_desc":
        order_clause = " ORDER BY price DESC"
    elif sort_by == "rating":
        order_clause = " ORDER BY rating DESC, review_count DESC"
    elif sort_by == "calories":
        order_clause = " ORDER BY calories ASC"
    else:  # popular
        order_clause = " ORDER BY rating DESC, review_count DESC"

    cursor.execute(f"SELECT * FROM foods{where_clause}{order_clause}", params)
    rows = cursor.fetchall()
    conn.close()

    return [format_food_row(r) for r in rows]

def get_db_food_by_id(food_id: int) -> Optional[Dict[str, Any]]:
    """Mengambil satu makanan dari database berdasarkan ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM foods WHERE id = ?", (food_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return format_food_row(row)
    return None

def create_db_food(data: Dict[str, Any]) -> Dict[str, Any]:
    """Menambahkan hidangan baru ke dalam database."""
    conn = get_connection()
    cursor = conn.cursor()

    # Generate next ID jika belum ada
    food_id = data.get("id")
    if not food_id:
        cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM foods")
        food_id = int(cursor.fetchone()[0])

    default_img = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"
    image_url = data.get("image_url") or default_img
    tags_json = json.dumps(data.get("tags", []), ensure_ascii=False)
    pairings_json = json.dumps(data.get("pairings", []), ensure_ascii=False)

    cursor.execute("""
    INSERT INTO foods (
        id, name, japanese_name, description, price, image_url,
        category, calories, prep_time_min, spiciness, is_vegetarian,
        is_halal, rating, review_count, tags, pairings, is_available
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        food_id,
        data["name"],
        data.get("japanese_name", ""),
        data["description"],
        int(data["price"]),
        image_url,
        data.get("category", "Utama"),
        int(data.get("calories", 0)),
        int(data.get("prep_time_min", 10)),
        int(data.get("spiciness", 0)),
        1 if data.get("is_vegetarian") else 0,
        1 if data.get("is_halal", True) else 0,
        float(data.get("rating", 4.8)),
        int(data.get("review_count", 0)),
        tags_json,
        pairings_json,
        1 if data.get("is_available", True) else 0
    ))
    conn.commit()
    conn.close()

    return get_db_food_by_id(food_id)

def update_db_food(food_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Memperbarui informasi hidangan di database."""
    existing = get_db_food_by_id(food_id)
    if not existing:
        return None

    conn = get_connection()
    cursor = conn.cursor()

    updates: List[str] = []
    params: List[Any] = []

    fields_map = [
        ("name", str),
        ("japanese_name", str),
        ("description", str),
        ("price", int),
        ("image_url", str),
        ("category", str),
        ("calories", int),
        ("prep_time_min", int),
        ("spiciness", int),
    ]

    for field, field_type in fields_map:
        if field in data and data[field] is not None:
            updates.append(f"{field} = ?")
            params.append(field_type(data[field]))

    if "is_vegetarian" in data and data["is_vegetarian"] is not None:
        updates.append("is_vegetarian = ?")
        params.append(1 if data["is_vegetarian"] else 0)

    if "is_halal" in data and data["is_halal"] is not None:
        updates.append("is_halal = ?")
        params.append(1 if data["is_halal"] else 0)

    if "is_available" in data and data["is_available"] is not None:
        updates.append("is_available = ?")
        params.append(1 if data["is_available"] else 0)

    if "tags" in data and data["tags"] is not None:
        updates.append("tags = ?")
        params.append(json.dumps(data["tags"], ensure_ascii=False))

    if "pairings" in data and data["pairings"] is not None:
        updates.append("pairings = ?")
        params.append(json.dumps(data["pairings"], ensure_ascii=False))

    if updates:
        params.append(food_id)
        cursor.execute(f"UPDATE foods SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    conn.close()
    return get_db_food_by_id(food_id)

def delete_db_food(food_id: int) -> bool:
    """Menghapus hidangan dari database secara permanen."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM foods WHERE id = ?", (food_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def toggle_food_availability(food_id: int, is_available: Optional[bool] = None) -> Optional[bool]:
    """Mengubah status ketersediaan menu (Tersedia / Habis)."""
    existing = get_db_food_by_id(food_id)
    if not existing:
        return None

    new_status = not existing["is_available"] if is_available is None else bool(is_available)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE foods SET is_available = ? WHERE id = ?", (1 if new_status else 0, food_id))
    conn.commit()
    conn.close()
    return new_status
