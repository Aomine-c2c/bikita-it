from ninja import Router
from django.db.models import Count, Q
from core.models import Asset, Ticket, NetworkDevice
from .schemas import ReportSummarySchema

router = Router()

@router.get("/summary", response=ReportSummarySchema)
def get_report_summary(request):
    # Asset metrics — no cost field exists; total_spend is always 0
    assets = Asset.objects.aggregate(
        total_count=Count('id'),
        active_count=Count('id', filter=Q(status='ACTIVE'))
    )

    # Ticket metrics — use correct uppercase status values
    tickets = Ticket.objects.aggregate(
        total_count=Count('id'),
        open_count=Count('id', filter=Q(status__in=['NEW', 'OPEN', 'IN_PROGRESS'])),
        resolved_count=Count('id', filter=Q(status__in=['RESOLVED', 'CLOSED']))
    )

    # Network metrics — use correct uppercase status value
    network = NetworkDevice.objects.aggregate(
        total_count=Count('id'),
        active_count=Count('id', filter=Q(status='ONLINE'))
    )

    return {
        "assets": {
            "total_count": assets['total_count'] or 0,
            "total_spend": 0.0,
            "active_count": assets['active_count'] or 0,
        },
        "tickets": {
            "total_count": tickets['total_count'] or 0,
            "open_count": tickets['open_count'] or 0,
            "resolved_count": tickets['resolved_count'] or 0,
        },
        "network": {
            "total_count": network['total_count'] or 0,
            "active_count": network['active_count'] or 0,
        }
    }
