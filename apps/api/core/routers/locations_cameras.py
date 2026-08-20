from core.permissions import require_admin
from ninja import Router
from typing import List, Optional, Any, Dict
from django.shortcuts import get_object_or_404
from core.models import Location, Camera, RackAssignment, Asset
from .schemas import LocationSchema, LocationInSchema, CameraSchema, RackAssignmentSchema

router = Router()

from .utils import safe_fk_id, log_operation

def normalize_location_payload(payload_dict: dict) -> dict:
    data = {}
    if "name" in payload_dict and payload_dict["name"]:
        data["name"] = payload_dict["name"]
    if "type" in payload_dict and payload_dict["type"]:
        data["type"] = payload_dict["type"]
        
    parent_val = (
        payload_dict.get("parent_id") or 
        payload_dict.get("parentId") or 
        payload_dict.get("parent_location_id") or 
        payload_dict.get("parentLocationId") or
        payload_dict.get("parent") or
        payload_dict.get("parent_location")
    )
    if parent_val is not None:
        data["parent_id"] = safe_fk_id(parent_val)
        
    return data

def _build_tree(locations, parent_id=None):
    """Recursively build a nested tree structure, treating non-existent parents as root nodes."""
    nodes = []
    known_ids = {loc.id for loc in locations}
    for loc in locations:
        pid = loc.parent_id if (loc.parent_id and loc.parent_id in known_ids) else None
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

# ─── Locations ─────────────────────────────────────────────────────────────────

@router.get("/locations", response=List[LocationSchema])
def get_locations(request):
    return list(Location.objects.select_related('parent').all())

@router.get("/locations/tree")
def get_location_tree(request):
    """Return all locations as a nested tree."""
    locations = list(Location.objects.select_related('parent').all())
    return _build_tree(locations, parent_id=None)

@router.get("/locations/{location_id}", response=LocationSchema)
def get_location(request, location_id: int):
    return get_object_or_404(Location.objects.select_related('parent'), id=location_id)

@router.post("/locations", response=LocationSchema)
def create_location(request, payload: LocationInSchema):
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_location_payload(raw_data)
    location = Location.objects.create(**data)
    log_operation(
        action="CREATE",
        resource_type="Location",
        resource_id=str(location.id),
        details={"name": location.name, "type": location.type},
    )
    return location

@router.patch("/locations/{location_id}", response=LocationSchema)
def update_location(request, location_id: int, payload: LocationInSchema):
    location = get_object_or_404(Location, id=location_id)
    raw_data = payload.dict(exclude_unset=True)
    data = normalize_location_payload(raw_data)
    for attr, value in data.items():
        setattr(location, attr, value)
    location.save()
    log_operation(
        action="UPDATE",
        resource_type="Location",
        resource_id=str(location.id),
        details={"updated_fields": list(data.keys()), "name": location.name},
    )
    return location

@router.delete("/locations/{location_id}")
@require_admin
def delete_location(request, location_id: int):
    location = get_object_or_404(Location, id=location_id)
    log_operation(
        action="DELETE",
        resource_type="Location",
        resource_id=str(location.id),
        details={"name": location.name},
    )
    location.delete()
    return {"success": True}

@router.get("/locations/{location_id}/rack-map", response=List[RackAssignmentSchema])
def get_rack_map(request, location_id: int):
    location = get_object_or_404(Location, id=location_id)
    return list(RackAssignment.objects.filter(location=location).select_related('device').all())

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
