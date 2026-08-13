from core.permissions import require_admin
from ninja import Router
from typing import List, Optional, Any, Dict
from django.shortcuts import get_object_or_404
from core.models import Location, Camera, RackAssignment, Asset
from .schemas import LocationSchema, LocationInSchema, CameraSchema, RackAssignmentSchema

router = Router()

# ─── Locations ─────────────────────────────────────────────────────────────────

@router.get("/locations", response=List[LocationSchema])
def get_locations(request):
    return list(Location.objects.select_related('parent').all())

@router.get("/locations/{location_id}", response=LocationSchema)
def get_location(request, location_id: int):
    return get_object_or_404(Location, id=location_id)

@router.post("/locations", response=LocationSchema)
def create_location(request, payload: LocationInSchema):
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    location = Location.objects.create(**data)
    return location

@router.patch("/locations/{location_id}", response=LocationSchema)
def update_location(request, location_id: int, payload: LocationInSchema):
    location = get_object_or_404(Location, id=location_id)
    data = payload.dict(exclude_unset=True)
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    for attr, value in data.items():
        setattr(location, attr, value)
    location.save()
    return location

@router.delete("/locations/{location_id}")
@require_admin
def delete_location(request, location_id: int):
    location = get_object_or_404(Location, id=location_id)
    location.delete()
    return {"success": True}

@router.get("/locations/{location_id}/rack-map", response=List[RackAssignmentSchema])
def get_rack_map(request, location_id: int):
    location = get_object_or_404(Location, id=location_id)
    return list(RackAssignment.objects.filter(location=location).select_related('device').all())

# ─── Location tree & details ───────────────────────────────────────────────────

def _build_tree(locations, parent_id=None):
    """Recursively build a nested tree structure."""
    nodes = []
    for loc in locations:
        pid = loc.parent_id if loc.parent_id else None
        if pid == parent_id:
            children = _build_tree(locations, parent_id=loc.id)
            nodes.append({
                "id": loc.id,
                "name": loc.name,
                "type": loc.type,
                "parentId": loc.parent_id,
                "children": children,
            })
    return nodes

@router.get("/locations/tree")
def get_location_tree(request):
    """Return all locations as a nested tree."""
    locations = list(Location.objects.select_related('parent').all())
    return _build_tree(locations, parent_id=None)

@router.get("/locations/{location_id}/details")
def get_location_details(request, location_id: int):
    """Return a location with its direct children and assigned assets."""
    location = get_object_or_404(Location, id=location_id)
    children = list(
        Location.objects.filter(parent=location).values("id", "name", "type")
    )
    assets = list(
        Asset.objects.filter(location=location).values(
            "id", "name", "category", "status", "asset_tag"
        )
    )
    return {
        "id": location.id,
        "name": location.name,
        "type": location.type,
        "parentId": location.parent_id,
        "children": children,
        "assets": assets,
        "assetCount": len(assets),
    }

# ─── Cameras ───────────────────────────────────────────────────────────────────

@router.get("/cameras", response=List[CameraSchema])
def get_cameras(request):
    return list(Camera.objects.select_related('location').all())

@router.get("/cameras/{camera_id}", response=CameraSchema)
def get_camera(request, camera_id: int):
    return get_object_or_404(Camera, id=camera_id)

@router.post("/cameras", response=CameraSchema)
def create_camera(request, payload: CameraSchema):
    camera = Camera.objects.create(**payload.dict(exclude_unset=True))
    return camera

@router.patch("/cameras/{camera_id}", response=CameraSchema)
def update_camera(request, camera_id: int, payload: CameraSchema):
    camera = get_object_or_404(Camera, id=camera_id)
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(camera, attr, value)
    camera.save()
    return camera

@router.delete("/cameras/{camera_id}")
@require_admin
def delete_camera(request, camera_id: int):
    camera = get_object_or_404(Camera, id=camera_id)
    camera.delete()
    return {"success": True}
