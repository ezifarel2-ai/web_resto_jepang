"""
Paket Database Modular Savoria
Memisahkan koneksi, skema DDL, repository menu makanan, repository pesanan, dan seeder.
"""

from .connection import DB_FILE, DB_TYPE, get_connection, get_active_db_type, DatabaseOfflineError, is_mysql_active
from .schema import create_tables, init_db
from .foods_repo import (
    get_db_foods,
    get_db_food_by_id,
    format_food_row,
    create_db_food,
    update_db_food,
    delete_db_food,
    toggle_food_availability
)
from .orders_repo import (
    save_order,
    get_orders,
    get_order_by_id,
    update_order_status,
    update_payment_status,
    get_dashboard_stats
)
from .seeder import seed_foods, seed_all

__all__ = [
    "DB_FILE",
    "DB_TYPE",
    "get_connection",
    "get_active_db_type",
    "create_tables",
    "init_db",
    "get_db_foods",
    "get_db_food_by_id",
    "format_food_row",
    "create_db_food",
    "update_db_food",
    "delete_db_food",
    "toggle_food_availability",
    "save_order",
    "get_orders",
    "get_order_by_id",
    "update_order_status",
    "update_payment_status",
    "get_dashboard_stats",
    "seed_foods",
    "seed_all",
]
