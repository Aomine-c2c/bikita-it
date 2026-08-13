from ninja import Router
from ninja_jwt.authentication import JWTAuth

from .routers.assets import router as assets_router
from .routers.network import router as network_router
from .routers.employees import router as employees_router
from .routers.inventory import router as inventory_router
from .routers.tickets_repairs import router as tickets_repairs_router
from .routers.locations_cameras import router as locations_cameras_router
from .routers.system import router as system_router
from .routers.accessories_software import router as accessories_software_router
from .routers.reports import router as reports_router

router = Router(auth=JWTAuth())

router.add_router("/assets", assets_router)
router.add_router("/employees", employees_router)
router.add_router("/inventory", inventory_router)
router.add_router("", network_router)
router.add_router("", tickets_repairs_router)
router.add_router("", locations_cameras_router)
router.add_router("", system_router)
router.add_router("", accessories_software_router)
router.add_router("/reports", reports_router)
