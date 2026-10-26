from pydantic import BaseModel
from typing import List, Optional

class CartItemInput(BaseModel):
    food_id: int
    quantity: int = 1
    notes: Optional[str] = ""

class OrderRequest(BaseModel):
    customer_name: str
    customer_phone: str
    order_type: str = "dine_in"  # dine_in / takeaway
    table_number: Optional[str] = ""
    notes: Optional[str] = ""
    payment_method: Optional[str] = "qris"  # 'qris' atau 'kasir'
    payment_status: Optional[str] = "belum_bayar"  # 'belum_bayar' atau 'lunas'
    items: List[CartItemInput]

class OrderResponse(BaseModel):
    order_id: str
    customer_name: str
    order_type: str
    table_number: str
    items: List[dict]
    subtotal: int
    tax: int
    service_fee: int
    grand_total: int
    payment_method: str = "qris"
    payment_status: str = "belum_bayar"
    whatsapp_url: str
    created_at: str

class OrderStatusUpdate(BaseModel):
    status: str  # 'menunggu', 'dimasak', 'selesai', 'dibatalkan'

class OrderPaymentUpdate(BaseModel):
    payment_status: str  # 'belum_bayar', 'lunas'
