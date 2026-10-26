"""
Paket Controllers (Routing & Request Dispatching)
"""

from .foods_controller import router as foods_router
from .orders_controller import router as orders_router
from .ai_controller import router as ai_router
from .views_controller import router as views_router

__all__ = [
    "foods_router",
    "orders_router",
    "ai_router",
    "views_router",
]
