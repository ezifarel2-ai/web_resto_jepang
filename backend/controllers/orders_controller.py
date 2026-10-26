from typing import Optional, List
from fastapi import APIRouter, HTTPException
from models.order_models import OrderRequest, OrderResponse, OrderStatusUpdate, OrderPaymentUpdate
import services.order_service as order_service
import db

router = APIRouter(tags=["Orders & Kitchen Dashboard"])

@router.post("/api/orders", response_model=OrderResponse)
def create_order(request: OrderRequest):
    """
    Membuat pesanan baru, menghitung subtotal, pajak, biaya layanan,
    menyimpan ke database SQLite, dan membuat link WhatsApp resmi.
    """
    return order_service.create_customer_order(request)

@router.get("/api/orders")
def get_orders_list(status: Optional[str] = None):
    """Mengambil daftar seluruh pesanan dari SQLite dengan opsi filter status ('menunggu', 'dimasak', 'selesai', 'dibatalkan')."""
    return db.get_orders(status_filter=status)

@router.get("/api/orders/stats")
def get_orders_statistics():
    """Mengambil ringkasan statistik pesanan, total revenue, dan jumlah menu aktif."""
    return db.get_dashboard_stats()

@router.get("/api/orders/{order_id}")
def get_single_order(order_id: str):
    """Mengambil detail pesanan tertentu berdasarkan ID pesanan."""
    order = db.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return order

@router.patch("/api/orders/{order_id}/status")
def change_order_status(order_id: str, payload: OrderStatusUpdate):
    """Mengubah status pesanan ('menunggu', 'dimasak', 'selesai', 'dibatalkan')."""
    success = db.update_order_status(order_id, payload.status)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Gagal memperbarui status. Pastikan ID pesanan valid dan status berupa: menunggu, dimasak, selesai, atau dibatalkan."
        )
    return {"message": "Status pesanan berhasil diperbarui", "order_id": order_id, "status": payload.status}

@router.patch("/api/orders/{order_id}/payment")
def change_order_payment(order_id: str, payload: OrderPaymentUpdate):
    """Mengubah status pembayaran ('belum_bayar', 'lunas')."""
    success = db.update_payment_status(order_id, payload.payment_status)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Gagal memperbarui status pembayaran. Status harus: 'belum_bayar' atau 'lunas'."
        )
    return {"message": "Status pembayaran berhasil diperbarui", "order_id": order_id, "payment_status": payload.payment_status}

@router.post("/api/orders/{order_id}/scan-cashier")
def scan_and_confirm_cashier_order(order_id: str):
    """
    Kasir memindai (scan) barcode pesanan tamu:
    1. Memvalidasi order_id
    2. Menandai payment_status = 'lunas'
    3. Mengubah status pesanan dari 'menunggu_kasir' menjadi 'menunggu' (diteruskan ke koki dapur)
    """
    order = db.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Pesanan dengan ID '{order_id}' tidak ditemukan.")

    db.update_payment_status(order_id, "lunas")
    # Jika sebelumnya tertahan di kasir, teruskan ke dapur
    if order.get("status") == "menunggu_kasir":
        db.update_order_status(order_id, "menunggu")

    updated_order = db.get_order_by_id(order_id)
    return {
        "status": "success",
        "message": f"Barcode #{order_id} berhasil di-scan! Pembayaran LUNAS dan pesanan resmi dikirim ke Koki Dapur.",
        "order": updated_order
    }

@router.get("/api/database/info")
def get_database_info():
    """Mengembalikan informasi konfigurasi database aktif (MySQL) dan statistik terkini."""
    stats = db.get_dashboard_stats()
    active_engine = db.get_active_db_type()
    import config
    return {
        "status": "connected",
        "engine": active_engine,
        "database": config.MYSQL_DB if "MySQL" in active_engine else db.DB_FILE,
        "host": config.MYSQL_HOST if "MySQL" in active_engine else "localhost",
        "tables": ["foods", "orders", "order_items"],
        "stats": stats
    }
