import re
import random
from typing import List, Dict, Any, Optional

FOOD_CATALOG: List[Dict[str, Any]] = [
    {
        "id": 1,
        "name": "Tonkotsu Ramen Spesial",
        "japanese_name": "特製豚骨ラーメン",
        "description": "Ramen kuah kaldu tulang gurih kaya rasa dimasak 12 jam, dilengkapi irisan chashu lembut, telur ajitsuke tamago setengah matang, nori renyah, dan jamur kuping.",
        "price": 58000,
        "image_url": "/static/images/ramen.jpg",
        "category": "Utama",
        "calories": 620,
        "prep_time_min": 15,
        "spiciness": 1,
        "is_vegetarian": False,
        "is_halal": True,
        "rating": 4.9,
        "review_count": 340,
        "tags": ["kuah hangat", "gurih", "best seller", "chashu", "tamago", "comfort food"],
        "pairings": [5, 6, 7]
    },
    {
        "id": 2,
        "name": "Salmon Sushi & Sashimi Platter",
        "japanese_name": "サーモン 寿司 盛り合わせ",
        "description": "Kombinasi sushi nigiri salmon segar Norwegia, sashimi tuna maguro grade A, dan salmon avocado roll dengan saus wasabi mayones istimewa.",
        "price": 75000,
        "image_url": "/static/images/sushi.jpg",
        "category": "Utama",
        "calories": 480,
        "prep_time_min": 12,
        "spiciness": 0,
        "is_vegetarian": False,
        "is_halal": True,
        "rating": 4.9,
        "review_count": 280,
        "tags": ["sushi", "salmon", "segar", "sehat", "chef recommendation", "mewah"],
        "pairings": [6, 12, 5]
    },
    {
        "id": 3,
        "name": "Chicken Katsu Curry",
        "japanese_name": "チキンカツカレー",
        "description": "Ayam katsu panko krispi keemasan disiram kuah kari khas Jepang kental wangi rempah, potongan wortel, kentang manis, disajikan dengan nasi pulen hangat.",
        "price": 48000,
        "image_url": "/static/images/katsu_curry.jpg",
        "category": "Utama",
        "calories": 710,
        "prep_time_min": 18,
        "spiciness": 1,
        "is_vegetarian": False,
        "is_halal": True,
        "rating": 4.8,
        "review_count": 215,
        "tags": ["kari", "katsu", "krispi", "kenyang", "gurih", "keluarga"],
        "pairings": [6, 12, 10]
    },
    {
        "id": 4,
        "name": "Wagyu Beef Donburi",
        "japanese_name": "和牛焼肉丼",
        "description": "Mangkuk nasi Jepang dengan irisan tipis daging sapi Wagyu meltique lembut dalam saus tare manis gurih karamel, taburan wijen sangrai, dan onsen egg lumer.",
        "price": 85000,
        "image_url": "/static/images/wagyu_don.jpg",
        "category": "Utama",
        "calories": 650,
        "prep_time_min": 15,
        "spiciness": 0,
        "is_vegetarian": False,
        "is_halal": True,
        "rating": 5.0,
        "review_count": 410,
        "tags": ["wagyu", "donburi", "daging", "mewah", "onsen egg", "best seller"],
        "pairings": [6, 7, 12]
    },
    {
        "id": 5,
        "name": "Ichigo Daifuku (Strawberry Mochi)",
        "japanese_name": "いちご大福",
        "description": "Mochi kenyal lembut buatan tangan berisi pasta kacang merah manis lembut (anko) dan buah stroberi segar utuh manis asam menyegarkan.",
        "price": 32000,
        "image_url": "/static/images/ichigo_daifuku.jpg",
        "category": "Penutup",
        "calories": 210,
        "prep_time_min": 5,
        "spiciness": 0,
        "is_vegetarian": True,
        "is_halal": True,
        "rating": 4.9,
        "review_count": 310,
        "tags": ["mochi", "stroberi", "manis", "penutup", "viral", "imut"],
        "pairings": [6, 12, 1]
    },
    {
        "id": 6,
        "name": "Authentic Iced Matcha Latte",
        "japanese_name": "本格 宇治抹茶ラテ",
        "description": "Teh hijau matcha Uji Kyoto asli ceremonial grade dipadukan dengan susu segar dingin creamy dan sedikit sirup tebu alami.",
        "price": 35000,
        "image_url": "/static/images/matcha_latte.jpg",
        "category": "Minuman",
        "calories": 160,
        "prep_time_min": 5,
        "spiciness": 0,
        "is_vegetarian": True,
        "is_halal": True,
        "rating": 4.8,
        "review_count": 275,
        "tags": ["matcha", "teh hijau", "segar", "creamy", "minuman favorit", "otentik"],
        "pairings": [1, 2, 5]
    },
    {
        "id": 7,
        "name": "Crispy Pan-Fried Gyoza (5 pcs)",
        "japanese_name": "焼き餃子",
        "description": "Pangsit Jepang berisi cincangan ayam dan sayuran kubis daun bawang dengan bagian dasar renyah keemasan, disajikan dengan saus ponzu wijen.",
        "price": 32000,
        "image_url": "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80",
        "category": "Pembuka",
        "calories": 280,
        "prep_time_min": 10,
        "spiciness": 0,
        "is_vegetarian": False,
        "is_halal": True,
        "rating": 4.7,
        "review_count": 190,
        "tags": ["gyoza", "pangsit", "krispi", "pembuka", "camilan", "gurih"],
        "pairings": [1, 4, 12]
    },
    {
        "id": 8,
        "name": "Osaka Takoyaki Ball (6 pcs)",
        "japanese_name": "大阪 たこ焼き",
        "description": "Bola adonan gurih khas Dotonbori Osaka berisi potongan gurita kenyal, dilumuri saus takoyaki manis gurih, mayo Jepang, dan serpihan katsuobushi menari.",
        "price": 34000,
        "image_url": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
        "category": "Pembuka",
        "calories": 320,
        "prep_time_min": 10,
        "spiciness": 0,
        "is_vegetarian": False,
        "is_halal": True,
        "rating": 4.8,
        "review_count": 240,
        "tags": ["takoyaki", "gurita", "street food", "gurih", "katsuobushi"],
        "pairings": [1, 6, 11]
    },
    {
        "id": 9,
        "name": "Spicy Ebi Tempura Udon",
        "japanese_name": "スパイシー 海老天うどん",
        "description": "Mie udon tebal kenyal dalam kuah dashi hangat bercita rasa pedas gurih, dilengkapi 2 udang tempura krispi mekar, daun bawang, dan narutomaki.",
        "price": 54000,
        "image_url": "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?auto=format&fit=crop&w=800&q=80",
        "category": "Utama",
        "calories": 530,
        "prep_time_min": 14,
        "spiciness": 2,
        "is_vegetarian": False,
        "is_halal": True,
        "rating": 4.8,
        "review_count": 185,
        "tags": ["udon", "tempura", "pedas", "kuah", "udang", "hangat"],
        "pairings": [11, 5, 8]
    },
    {
        "id": 10,
        "name": "Dorayaki Hokkaido Sweet Bean",
        "japanese_name": "北海道 どら焼き",
        "description": "Pancake lembut empuk ala Jepang dengan isian pasta kacang merah manis legit dan aroma madu bunga liar alami.",
        "price": 26000,
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
        "category": "Penutup",
        "calories": 240,
        "prep_time_min": 5,
        "spiciness": 0,
        "is_vegetarian": True,
        "is_halal": True,
        "rating": 4.7,
        "review_count": 160,
        "tags": ["dorayaki", "pancake", "kacang merah", "manis", "penutup", "anak-anak"],
        "pairings": [6, 12, 3]
    },
    {
        "id": 11,
        "name": "Yuzu Sparkling Mint Cooler",
        "japanese_name": "柚子 スパークリング",
        "description": "Minuman soda menyegarkan dengan ekstrak buah jeruk Yuzu Jepang asli, daun mint segar, dan perasan jeruk nipis dingin.",
        "price": 28000,
        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
        "category": "Minuman",
        "calories": 95,
        "prep_time_min": 4,
        "spiciness": 0,
        "is_vegetarian": True,
        "is_halal": True,
        "rating": 4.9,
        "review_count": 210,
        "tags": ["yuzu", "soda", "segar", "dingin", "asam manis", "pelepas dahaga"],
        "pairings": [3, 4, 9]
    },
    {
        "id": 12,
        "name": "Sencha Green Tea (Refill)",
        "japanese_name": "特撰 煎茶 (お代わり自由)",
        "description": "Seduhan teh hijau daun Sencha asli Shizuoka dengan aroma wangi menenangkan, kaya antioksidan, dan bisa diisi ulang sepuasnya.",
        "price": 18000,
        "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
        "category": "Minuman",
        "calories": 5,
        "prep_time_min": 3,
        "spiciness": 0,
        "is_vegetarian": True,
        "is_halal": True,
        "rating": 4.8,
        "review_count": 320,
        "tags": ["ocha", "teh hangat", "sencha", "bebas refill", "sehat", "nol kalori"],
        "pairings": [1, 2, 4, 7]
    }
]

FOOD_MAP = {food["id"]: food for food in FOOD_CATALOG}

def get_live_catalog() -> List[Dict[str, Any]]:
    """Mengambil katalog makanan aktif langsung dari database SQLite, fallback ke FOOD_CATALOG."""
    try:
        import db
        items = db.get_db_foods()
        if items:
            return items
    except Exception:
        pass
    return FOOD_CATALOG

def get_live_map() -> Dict[int, Dict[str, Any]]:
    """Mengambil mapping ID hidangan aktif ke objek detailnya."""
    catalog = get_live_catalog()
    m = {food["id"]: food for food in FOOD_CATALOG}
    m.update({food["id"]: food for food in catalog})
    return m

def get_food_by_id(food_id: int) -> Optional[Dict[str, Any]]:
    try:
        import db
        db_item = db.get_db_food_by_id(food_id)
        if db_item:
            return db_item
    except Exception:
        pass
    return get_live_map().get(food_id)

def get_all_foods(
    query: str = "",
    category: str = "",
    max_price: Optional[int] = None,
    is_halal: Optional[bool] = None,
    is_vegetarian: Optional[bool] = None,
    is_spicy: Optional[bool] = None,
    sort_by: str = "popular"
) -> List[Dict[str, Any]]:
    try:
        import db
        db_items = db.get_db_foods(
            query=query,
            category=category,
            max_price=max_price,
            is_halal=is_halal,
            is_vegetarian=is_vegetarian,
            is_spicy=is_spicy,
            sort_by=sort_by
        )
        if db_items:
            return db_items
    except Exception:
        pass

    results = list(get_live_catalog())

    if query:
        q = query.lower()
        results = [
            f for f in results
            if q in f["name"].lower()
            or q in f["japanese_name"].lower()
            or q in f["description"].lower()
            or q in f["category"].lower()
            or any(q in tag.lower() for tag in f.get("tags", []))
        ]

    if category:
        results = [f for f in results if f["category"].lower() == category.lower()]

    if max_price is not None and max_price > 0:
        results = [f for f in results if f["price"] <= max_price]

    if is_halal is True:
        results = [f for f in results if f.get("is_halal") is True]

    if is_vegetarian is True:
        results = [f for f in results if f.get("is_vegetarian") is True]

    if is_spicy is True:
        results = [f for f in results if f.get("spiciness", 0) > 0]
    elif is_spicy is False:
        results = [f for f in results if f.get("spiciness", 0) == 0]

    # Sorting
    if sort_by == "price_asc":
        results.sort(key=lambda x: x["price"])
    elif sort_by == "price_desc":
        results.sort(key=lambda x: x["price"], reverse=True)
    elif sort_by == "rating":
        results.sort(key=lambda x: x["rating"], reverse=True)
    elif sort_by == "popular":
        results.sort(key=lambda x: x.get("review_count", 0), reverse=True)

    return results

def get_smart_recommendations(food_ids: List[int], limit: int = 3) -> List[Dict[str, Any]]:
    catalog = get_live_catalog()
    food_map = get_live_map()
    if not food_ids:
        # Default: best sellers
        sorted_foods = sorted(catalog, key=lambda x: x.get("rating", 0), reverse=True)
        return sorted_foods[:limit]

    # Gather pairing IDs from target foods
    pairing_counts: Dict[int, int] = {}
    for fid in food_ids:
        food = food_map.get(fid)
        if food and "pairings" in food:
            for pid in food["pairings"]:
                if pid not in food_ids:
                    pairing_counts[pid] = pairing_counts.get(pid, 0) + 1

    if pairing_counts:
        sorted_pairs = sorted(pairing_counts.keys(), key=lambda pid: (pairing_counts[pid], food_map.get(pid, {}).get("rating", 0)), reverse=True)
        recommended = [food_map[pid] for pid in sorted_pairs if pid in food_map]
        if len(recommended) < limit:
            remaining = [f for f in catalog if f["id"] not in food_ids and f["id"] not in sorted_pairs]
            recommended.extend(remaining[:limit - len(recommended)])
        return recommended[:limit]
    
    # Fallback if no specific pairing found
    remaining = [f for f in catalog if f["id"] not in food_ids]
    return remaining[:limit]

# --- SMART COMBO & BUDGET OPTIMIZER ALGORITHM ---
def generate_smart_combo(
    budget: int,
    people_count: int = 1,
    preference: str = "all",
    is_halal: bool = True,
    is_vegetarian: bool = False
) -> Dict[str, Any]:
    """
    Menggunakan algoritma constraint satisfaction / heuristic optimization
    untuk memilih set hidangan (Main + Drink + Appetizer/Dessert)
    yang memberikan kepuasan rasa & nilai gizi tertinggi di bawah budget.
    """
    catalog = get_live_catalog()
    eligible = [f for f in catalog if (not is_halal or f.get("is_halal")) and (not is_vegetarian or f.get("is_vegetarian"))]
    
    # Filter preferences if specified
    if preference == "gurih":
        eligible_mains = [f for f in eligible if f["category"] == "Utama" and any(t in ["gurih", "kuah hangat", "wagyu", "kari"] for t in f["tags"])]
    elif preference == "pedas":
        eligible_mains = [f for f in eligible if f["category"] == "Utama" and f["spiciness"] > 0]
    elif preference == "manis":
        eligible_mains = [f for f in eligible if f["category"] in ["Utama", "Penutup"]]
    elif preference == "sehat":
        eligible_mains = [f for f in eligible if f["calories"] <= 500]
    else:
        eligible_mains = [f for f in eligible if f["category"] == "Utama"]

    if not eligible_mains:
        eligible_mains = [f for f in eligible if f["category"] == "Utama"] or eligible

    mains = [f for f in eligible if f["category"] == "Utama"]
    drinks = [f for f in eligible if f["category"] == "Minuman"]
    sides = [f for f in eligible if f["category"] in ["Pembuka", "Penutup"]]

    # Let's target: for each person: 1 Main + 1 Drink + optionally 1 Side to share/per person
    best_combo = []
    best_score = -1
    best_cost = 0

    # Iterative heuristic search
    # Target mains needed: people_count
    # Target drinks needed: people_count
    # Try combinations of top-rated items
    for m in sorted(eligible_mains, key=lambda x: x["rating"], reverse=True):
        for d in sorted(drinks, key=lambda x: x["rating"], reverse=True):
            base_items = [m]
            base_cost = m["price"]
            
            # For 2+ people, add a complementary main
            if people_count >= 2:
                other_mains = [om for om in mains if om["id"] != m["id"]]
                if other_mains:
                    m2 = other_mains[0]
                    base_items.append(m2)
                    base_cost += m2["price"]

            # Add drinks
            base_items.append(d)
            base_cost += d["price"]
            if people_count >= 2:
                d2 = drinks[1] if len(drinks) > 1 else d
                base_items.append(d2)
                base_cost += d2["price"]

            # If still within budget, greedily try to add side or dessert
            remaining_budget = budget - base_cost
            if remaining_budget >= 0:
                affordable_sides = [s for s in sides if s["price"] <= remaining_budget]
                affordable_sides.sort(key=lambda x: x["rating"], reverse=True)
                
                combo_items = list(base_items)
                curr_cost = base_cost
                for s in affordable_sides:
                    if curr_cost + s["price"] <= budget:
                        combo_items.append(s)
                        curr_cost += s["price"]
                        break

                # Heuristic Score = Total Rating * 10 + (Cost / Budget * 15)
                avg_rating = sum(item["rating"] for item in combo_items) / len(combo_items)
                budget_utilization = curr_cost / budget
                score = (avg_rating * 20) + (budget_utilization * 10) + len(combo_items)

                if score > best_score and curr_cost <= budget:
                    best_score = score
                    best_combo = combo_items
                    best_cost = curr_cost

    # If nothing fit, fallback to most affordable items
    if not best_combo:
        cheapest_main = min(mains, key=lambda x: x["price"])
        cheapest_drink = min(drinks, key=lambda x: x["price"])
        best_combo = [cheapest_main, cheapest_drink]
        best_cost = cheapest_main["price"] + cheapest_drink["price"]

    savings = max(0, budget - best_cost)
    total_cals = sum(item.get("calories", 0) for item in best_combo)

    # Naming the combo nicely
    combo_names = [
        "Savoria Omakase AI Selection",
        "Harmoni Cita Rasa Tokyo Set",
        "Sensasi Kuliner Otentik Kyoto",
        "Executive Japanese Dining Combo"
    ]
    combo_name = random.choice(combo_names)
    
    desc = f"Paket rekomendasi cerdas untuk {people_count} orang dengan perpaduan hidangan utama, minuman segar, dan pelengkap yang dirancang seimbang dan harmonis."

    profile = "Kombinasi umami kaya rasa, kesegaran minuman teh/buah alami, dan keseimbangan tekstur renyah lembut."

    return {
        "combo_name": combo_name,
        "description": desc,
        "items": best_combo,
        "total_price": best_cost,
        "budget": budget,
        "savings": savings,
        "total_calories": total_cals,
        "taste_profile": profile
    }
