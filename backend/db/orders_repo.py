from datetime import datetime
from typing import List, Dict, Any, Optional
from .connection import get_connection

def save_order(
    order_id: str,
    customer_name: str,
    customer_phone: str,
    order_type: str,
    table_number: str,
    notes: str,
    items_detail: List[Dict[str, Any]],
    subtotal: int,
    tax: int,
    service_fee: int,
    grand_total: int,
    payment_method: str = "qris",
    payment_status: str = "belum_bayar"
) -> bool:
    """Menyimpan pesanan baru beserta rincian item ke SQLite secara transaksional."""
    # Jika bayar di kasir dan belum bayar, status awal adalah 'menunggu_kasir' (belum diproses dapur)
    initial_status = "menunggu_kasir" if payment_method == "kasir" and payment_status == "belum_bayar" else "menunggu"

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO orders (
            order_id, customer_name, customer_phone, order_type, table_number, 
            notes, subtotal, tax, service_fee, grand_total, status, payment_method, payment_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            order_id, customer_name, customer_phone, order_type, table_number,
            notes, subtotal, tax, service_fee, grand_total, initial_status, payment_method, payment_status,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        for it in items_detail:
            cursor.execute("""
            INSERT INTO order_items (
                order_id, food_id, food_name, price, quantity, line_total, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                order_id, it["id"], it["name"], it["price"], 
                it["quantity"], it["line_total"], it.get("notes", "")
            ))

        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print("Database insert error:", e)
        return False
    finally:
        conn.close()

def get_orders(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Mengambil daftar seluruh pesanan beserta rincian item hidangannya."""
    conn = get_connection()
    cursor = conn.cursor()

    if status_filter and status_filter != "semua":
        cursor.execute("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC", (status_filter,))
    else:
        cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
    
    order_rows = cursor.fetchall()
    results = []

    for row in order_rows:
        order = dict(row)
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order["order_id"],))
        item_rows = cursor.fetchall()
        order["items"] = [dict(it) for it in item_rows]
        results.append(order)

    conn.close()
    return results

def get_order_by_id(order_id: str) -> Optional[Dict[str, Any]]:
    """Mengambil satu pesanan lengkap berdasarkan order_id."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    
    order = dict(row)
    cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
    item_rows = cursor.fetchall()
    order["items"] = [dict(it) for it in item_rows]
    conn.close()
    return order

def update_order_status(order_id: str, new_status: str) -> bool:
    """Mengubah status pesanan ('menunggu', 'dimasak', 'selesai', 'dibatalkan', 'menunggu_kasir')."""
    valid_statuses = {"menunggu", "dimasak", "selesai", "dibatalkan", "menunggu_kasir"}
    if new_status not in valid_statuses:
        return False

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE orders SET status = ? WHERE order_id = ?", (new_status, order_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def update_payment_status(order_id: str, new_payment_status: str) -> bool:
    """Mengubah status pembayaran ('belum_bayar', 'lunas')."""
    valid_statuses = {"belum_bayar", "lunas"}
    if new_payment_status not in valid_statuses:
        return False

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE orders SET payment_status = ? WHERE order_id = ?", (new_payment_status, order_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def get_dashboard_stats() -> Dict[str, Any]:
    """Mengambil ringkasan statistik untuk dasbor dapur & kasir."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM orders")
    total_orders = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'menunggu'")
    pending_orders = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'dimasak'")
    cooking_orders = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'selesai'")
    completed_orders = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE status != 'dibatalkan'")
    total_revenue = cursor.fetchone()[0]

    # Omset lunas (QRIS / Kasir Lunas)
    cursor.execute("SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE payment_status = 'lunas' AND status != 'dibatalkan'")
    paid_revenue = cursor.fetchone()[0]

    # Tagihan belum dibayar (Kasir pending)
    cursor.execute("SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE payment_status = 'belum_bayar' AND status != 'dibatalkan'")
    unpaid_revenue = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM foods")
    total_menu_items = cursor.fetchone()[0]

    conn.close()
    return {
        "total_orders": int(total_orders or 0),
        "pending_orders": int(pending_orders or 0),
        "cooking_orders": int(cooking_orders or 0),
        "completed_orders": int(completed_orders or 0),
        "total_revenue": int(float(total_revenue or 0)),
        "paid_revenue": int(float(paid_revenue or 0)),
        "unpaid_revenue": int(float(unpaid_revenue or 0)),
        "total_menu_items": int(total_menu_items or 0)
    }
