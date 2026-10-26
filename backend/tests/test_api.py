import os
import sys
import pytest

# Pastikan path direktori proyek masuk ke sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_index_view():
    """Halaman utama memuat UI restoran saat online, atau 500 Internal Server Error saat offline."""
    response = client.get("/")
    if response.status_code == 200:
        assert "Lacak Pesanan" in response.text
        assert "/admin" in response.text
    else:
        assert response.status_code == 500
        assert "Internal Server Error" in response.text

def test_admin_view():
    """Halaman portal admin (/admin) dapat diakses saat online, atau 500 Internal Server Error saat offline."""
    response = client.get("/admin")
    if response.status_code == 200:
        assert "SAVORIA ADMIN PORTAL" in response.text
    else:
        assert response.status_code == 500
        assert "Internal Server Error" in response.text

def test_kitchen_view():
    """Halaman dasbor dapur (/kitchen) dapat diakses saat online, atau 500 Internal Server Error saat offline."""
    response = client.get("/kitchen")
    if response.status_code == 200:
        assert "SAVORIA KITCHEN OPS" in response.text
    else:
        assert response.status_code == 500
        assert "Internal Server Error" in response.text

def test_qr_generator_view():
    """Halaman cetak stiker QR meja (/kitchen/qr) dapat diakses saat online, atau 500 Internal Server Error saat offline."""
    response = client.get("/kitchen/qr")
    if response.status_code == 200:
        assert "SAVORIA QR TABLE STICKERS" in response.text
    else:
        assert response.status_code == 500
        assert "Internal Server Error" in response.text

def test_foods_catalog_api():
    """Endpoint /api/foods mengembalikan menu dari database."""
    response = client.get("/api/foods")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "name" in data[0]
    assert "price" in data[0]

def test_order_creation_and_tracking_flow():
    """Alur lengkap: buat pesanan -> lacak status -> ubah status dapur."""
    payload = {
        "customer_name": "Testing Tamu",
        "customer_phone": "081999888777",
        "order_type": "dine_in",
        "table_number": "Meja 12",
        "notes": "Jangan terlalu asin",
        "items": [
            {"food_id": 1, "quantity": 1, "notes": "Tanpa nori"}
        ]
    }
    # 1. Buat pesanan
    create_res = client.post("/api/orders", json=payload)
    assert create_res.status_code == 200
    order_data = create_res.json()
    order_id = order_data["order_id"]
    assert order_id.startswith("SVR-")
    assert order_data["subtotal"] > 0
    assert order_data["tax"] > 0
    assert order_data["service_fee"] > 0
    assert order_data["grand_total"] == order_data["subtotal"] + order_data["tax"] + order_data["service_fee"]

    # 2. Lacak status pesanan (default: menunggu)
    track_res = client.get(f"/api/orders/{order_id}")
    assert track_res.status_code == 200
    assert track_res.json()["status"] == "menunggu"

    # 3. Koki memperbarui status ke dimasak
    patch_res = client.patch(f"/api/orders/{order_id}/status", json={"status": "dimasak"})
    assert patch_res.status_code == 200
    assert client.get(f"/api/orders/{order_id}").json()["status"] == "dimasak"

    # 4. Koki menyelesaikan hidangan
    finish_res = client.patch(f"/api/orders/{order_id}/status", json={"status": "selesai"})
    assert finish_res.status_code == 200
    assert client.get(f"/api/orders/{order_id}").json()["status"] == "selesai"

def test_ai_recommendations_and_smart_combo():
    """Memverifikasi fungsi pairing recommendations dan combo generator."""
    rec_res = client.get("/api/ai/recommendations?food_ids=1")
    assert rec_res.status_code == 200
    recs = rec_res.json()
    assert isinstance(recs, list)
    assert len(recs) > 0

    combo_res = client.post("/api/ai/smart-combo", json={
        "budget": 100000,
        "people_count": 1,
        "preference": "gurih",
        "is_halal": True,
        "is_vegetarian": False
    })
    assert combo_res.status_code == 200
    combo_data = combo_res.json()
    assert combo_data["total_price"] <= 100000
    assert len(combo_data["items"]) >= 2

def test_qris_and_cashier_payment_flows():
    """Menguji dua skenario pembayaran: QRIS digital (bebas kasir) dan Bayar di Kasir (lunas manual)."""
    # Skenario 1: Tamu bayar via QRIS (langsung lunas di meja tanpa ke kasir)
    qris_payload = {
        "customer_name": "Tamu QRIS",
        "customer_phone": "081234567890",
        "order_type": "dine_in",
        "table_number": "Meja 05",
        "payment_method": "qris",
        "payment_status": "lunas",
        "items": [{"food_id": 1, "quantity": 1}]
    }
    qris_res = client.post("/api/orders", json=qris_payload)
    assert qris_res.status_code == 200
    qris_order = qris_res.json()
    assert qris_order["payment_method"] == "qris"
    assert qris_order["payment_status"] == "lunas"

    # Verifikasi di database
    check_qris = client.get(f"/api/orders/{qris_order['order_id']}").json()
    assert check_qris["payment_method"] == "qris"
    assert check_qris["payment_status"] == "lunas"

    # Skenario 2: Tamu pilih Bayar di Kasir (status awal: belum_bayar)
    kasir_payload = {
        "customer_name": "Tamu Kasir",
        "customer_phone": "081234567890",
        "order_type": "dine_in",
        "table_number": "Meja 09",
        "payment_method": "kasir",
        "payment_status": "belum_bayar",
        "items": [{"food_id": 2, "quantity": 1}]
    }
    kasir_res = client.post("/api/orders", json=kasir_payload)
    assert kasir_res.status_code == 200
    kasir_order = kasir_res.json()
    assert kasir_order["payment_method"] == "kasir"
    assert kasir_order["payment_status"] == "belum_bayar"

    # Kasir menerima pembayaran tunai dan menandai lunas
    pay_patch = client.patch(f"/api/orders/{kasir_order['order_id']}/payment", json={"payment_status": "lunas"})
    assert pay_patch.status_code == 200
    assert pay_patch.json()["payment_status"] == "lunas"

    # Verifikasi status sudah lunas
    check_kasir = client.get(f"/api/orders/{kasir_order['order_id']}").json()
    assert check_kasir["payment_status"] == "lunas"

    # Verifikasi statistik dasbor mencatat paid_revenue
    stats_res = client.get("/api/orders/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "paid_revenue" in stats
    assert "unpaid_revenue" in stats
    assert stats["paid_revenue"] > 0

def test_food_management_crud_flow():
    """Alur lengkap CRUD manajemen hidangan oleh staf / admin."""
    # 1. Tambah menu baru
    new_food = {
        "name": "Chicken Katsu Curry Test",
        "japanese_name": "チキンカツカレー",
        "description": "Katsu ayam renyah dengan saus kari Jepang autentik.",
        "price": 48000,
        "category": "Utama",
        "prep_time_min": 12,
        "is_halal": True,
        "tags": ["katsu", "curry", "ayam"]
    }
    create_res = client.post("/api/foods", json=new_food)
    assert create_res.status_code == 201
    created_data = create_res.json()
    food_id = created_data["id"]
    assert created_data["name"] == "Chicken Katsu Curry Test"
    assert created_data["price"] == 48000

    # 2. Ambil detail menu
    detail_res = client.get(f"/api/foods/{food_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == food_id

    # 3. Update informasi menu
    update_res = client.put(f"/api/foods/{food_id}", json={"price": 52000, "description": "Katsu ayam spesial kari lezat"})
    assert update_res.status_code == 200
    assert update_res.json()["price"] == 52000

    # 4. Ubah ketersediaan (toggle availability)
    toggle_res = client.patch(f"/api/foods/{food_id}/availability", params={"is_available": False})
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_available"] is False

    # 5. Hapus menu uji coba
    del_res = client.delete(f"/api/foods/{food_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # 6. Pastikan menu sudah tidak ditemukan
    verify_del = client.get(f"/api/foods/{food_id}")
    assert verify_del.status_code == 404

