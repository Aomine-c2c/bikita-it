from core.permissions import require_admin
from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from core.models import Location, Camera, RackAssignment
from .schemas import LocationSchema, CameraSchema, RackAssignmentSchema

router = Router()

# Locations
@router.get("/locations", response=List[LocationSchema])
def get_locations(request):
    return list(Location.objects.select_related('parent').all())

@router.get("/locations/{location_id}", response=LocationSchema)
def get_location(request, location_id: int):
    return get_object_or_404(Location, id=location_id)

@router.post("/locations", response=LocationSchema)
def create_location(request, payload: LocationSchema):
    location = Location.objects.create(**payload.dict(exclude_unset=True))
    return location

@router.patch("/locations/{location_id}", response=LocationSchema)
def update_location(request, location_id: int, payload: LocationSchema):
    location = get_object_or_404(Location, id=location_id)
    for attr, value in payload.dict(exclude_unset=True).items():
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
    # Verify location exists
    location = get_object_or_404(Location, id=location_id)
    return list(RackAssignment.objects.filter(location=location).select_related('device').all())

# Cameras
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
