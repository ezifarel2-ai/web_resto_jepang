import json
from .connection import get_connection

def seed_foods(force: bool = False):
    """Mengisi database dengan katalog hidangan otentik jika tabel foods masih kosong."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM foods")
    count = cursor.fetchone()[0]

    if count == 0 or force:
        try:
            from ai_engine import FOOD_CATALOG
            foods_to_seed = FOOD_CATALOG
        except ImportError:
            foods_to_seed = []

        if force and count > 0:
            cursor.execute("DELETE FROM foods")

        for f in foods_to_seed:
            cursor.execute("""
            REPLACE INTO foods (
                id, name, japanese_name, description, price, image_url,
                category, calories, prep_time_min, spiciness, is_vegetarian,
                is_halal, rating, review_count, tags, pairings, is_available
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                f["id"],
                f["name"],
                f.get("japanese_name", ""),
                f.get("description", ""),
                f["price"],
                f.get("image_url", ""),
                f.get("category", "Utama"),
                f.get("calories", 0),
                f.get("prep_time_min", 10),
                f.get("spiciness", 0),
                1 if f.get("is_vegetarian") else 0,
                1 if f.get("is_halal", True) else 0,
                f.get("rating", 4.8),
                f.get("review_count", 0),
                json.dumps(f.get("tags", []), ensure_ascii=False),
                json.dumps(f.get("pairings", []), ensure_ascii=False)
            ))
        conn.commit()
    conn.close()

def seed_tables():
    """Mengisi daftar meja restoran dan token QR Code meja jika tabel tables kosong."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM tables")
    if cursor.fetchone()[0] == 0:
        # Meja Reguler Main Dining (01 s/d 12)
        for i in range(1, 13):
            table_name = f"Meja {str(i).zfill(2)}"
            qr_token = f"SAVORIA-TBL-{str(i).zfill(2)}"
            cursor.execute("""
            INSERT INTO tables (table_number, capacity, section, status, qr_token)
            VALUES (?, 4, 'Main Dining', 'available', ?)
            """, (table_name, qr_token))

        # Meja VIP Tatami Room (VIP 01 & VIP 02)
        for v in [1, 2]:
            table_name = f"VIP {str(v).zfill(2)}"
            qr_token = f"SAVORIA-VIP-{str(v).zfill(2)}"
            cursor.execute("""
            INSERT INTO tables (table_number, capacity, section, status, qr_token)
            VALUES (?, 8, 'VIP Tatami Room', 'available', ?)
            """, (table_name, qr_token))

        conn.commit()
    conn.close()

def seed_all():
    """Menjalankan seeder data menu dan meja restoran."""
    seed_foods()
    seed_tables()
