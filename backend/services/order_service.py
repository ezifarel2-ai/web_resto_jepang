import random
import time
import urllib.parse
from datetime import datetime
from fastapi import HTTPException
from models.order_models import OrderRequest, OrderResponse
import db
import ai_engine

import config

RESTAURANT_WHATSAPP_NUMBER = config.RESTAURANT_WHATSAPP_NUMBER

def create_customer_order(request: OrderRequest) -> OrderResponse:
    """
    Service untuk memproses pesanan baru:
    1. Validasi isi keranjang
    2. Menghitung subtotal, pajak, dan service fee
    3. Menyusun template pesan WhatsApp terformat rapi
    4. Menyimpan transaksi secara transaksional ke database SQLite
    5. Mengembalikan data OrderResponse lengkap
    """
    if not request.items:
        raise HTTPException(status_code=400, detail="Keranjang pesanan masih kosong.")

    order_id = f"SVR-{int(time.time() * 1000)}-{random.randint(10, 99)}"
    items_detail = []
    subtotal = 0

    for item_input in request.items:
        food = ai_engine.get_food_by_id(item_input.food_id)
        if not food:
            continue
        line_total = food["price"] * item_input.quantity
        subtotal += line_total
        items_detail.append({
            "id": food["id"],
            "name": food["name"],
            "price": food["price"],
            "quantity": item_input.quantity,
            "line_total": line_total,
            "notes": item_input.notes or ""
        })

    tax = int(subtotal * config.TAX_RATE)
    service_fee = int(subtotal * config.SERVICE_FEE_RATE)
    grand_total = subtotal + tax + service_fee

    # Format pesan WhatsApp
    wa_lines = [
        f"🎌 *PESANAN BARU - SAVORIA RESTAURANT* 🎌",
        f"No Pesanan: #{order_id}",
        f"Nama Pelanggan: {request.customer_name}",
        f"Tipe Pesanan: {'Makan di Tempat (Meja: ' + (request.table_number or '-') + ')' if request.order_type == 'dine_in' else 'Bungkus / Takeaway'}",
        "------------------------------------",
        "*Daftar Pesanan:*"
    ]

    for item in items_detail:
        notes_str = f" (Catatan: {item['notes']})" if item['notes'] else ""
        wa_lines.append(f"• {item['name']} x{item['quantity']} = Rp {item['line_total']:,}".replace(',', '.') + notes_str)

    wa_lines.extend([
        "------------------------------------",
        f"Subtotal: Rp {subtotal:,}".replace(',', '.'),
        f"Pajak Restoran (10%): Rp {tax:,}".replace(',', '.'),
        f"Biaya Layanan (5%): Rp {service_fee:,}".replace(',', '.'),
        f"*TOTAL AKHIR: Rp {grand_total:,}*".replace(',', '.'),
        "------------------------------------",
        f"Catatan Khusus: {request.notes or '-'}",
        "Mohon segera diproses, terima kasih! Arigatou Gozaimasu 🙏"
    ])

    wa_message = "\n".join(wa_lines)
    whatsapp_url = f"https://wa.me/{RESTAURANT_WHATSAPP_NUMBER}?text={urllib.parse.quote(wa_message)}"

    pay_method = request.payment_method or "qris"
    pay_status = request.payment_status or "belum_bayar"

    # Simpan ke SQLite melalui modul db
    db.save_order(
        order_id=order_id,
        customer_name=request.customer_name,
        customer_phone=request.customer_phone,
        order_type=request.order_type,
        table_number=request.table_number or "-",
        notes=request.notes or "",
        items_detail=items_detail,
        subtotal=subtotal,
        tax=tax,
        service_fee=service_fee,
        grand_total=grand_total,
        payment_method=pay_method,
        payment_status=pay_status
    )

    return OrderResponse(
        order_id=order_id,
        customer_name=request.customer_name,
        order_type=request.order_type,
        table_number=request.table_number or "-",
        items=items_detail,
        subtotal=subtotal,
        tax=tax,
        service_fee=service_fee,
        grand_total=grand_total,
        payment_method=pay_method,
        payment_status=pay_status,
        whatsapp_url=whatsapp_url,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
