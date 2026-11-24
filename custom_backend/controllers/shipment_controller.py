from fastapi import APIRouter, Depends, HTTPException, Query, status
from custom_backend.models.shipment import ShipmentCreate, ShipmentUpdate, StatusType
from custom_backend.repository.shipment_repository import ShipmentRepository
from custom_backend.services.shipment_service import ShipmentService

router = APIRouter(prefix="/api/v1", tags=["Shipments"])


def get_shipment_service() -> ShipmentService:
    return ShipmentService(ShipmentRepository())


@router.get("/shipments")
def get_shipments(
    search: str | None = Query(default=None),
    status_filter: StatusType | None = Query(default=None, alias="status"),
    service: ShipmentService = Depends(get_shipment_service),
):
    data = service.list_shipments(search=search, status=status_filter)
    return {
        "success": True,
        "total": len(data),
        "data": [item.model_dump() for item in data],
    }


@router.get("/shipments/{shipment_id}")
def get_shipment(
    shipment_id: str,
    service: ShipmentService = Depends(get_shipment_service),
):
    item = service.get_shipment(shipment_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": f"Shipment with id '{shipment_id}' not found.",
            },
        )
    return {
        "success": True,
        "data": item.model_dump(),
    }


@router.post("/shipments", status_code=status.HTTP_201_CREATED)
def create_shipment(
    payload: ShipmentCreate,
    service: ShipmentService = Depends(get_shipment_service),
):
    created = service.create_shipment(payload)
    return {
        "success": True,
        "message": "Shipment created successfully.",
        "data": created.model_dump(),
    }


@router.put("/shipments/{shipment_id}")
def update_shipment(
    shipment_id: str,
    payload: ShipmentUpdate,
    service: ShipmentService = Depends(get_shipment_service),
):
    updated = service.update_shipment(shipment_id, payload)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": f"Shipment with id '{shipment_id}' not found.",
            },
        )
    return {
        "success": True,
        "message": "Shipment updated successfully.",
        "data": updated.model_dump(),
    }


@router.delete("/shipments/{shipment_id}")
def delete_shipment(
    shipment_id: str,
    service: ShipmentService = Depends(get_shipment_service),
):
    deleted = service.delete_shipment(shipment_id)
    if deleted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": f"Shipment with id '{shipment_id}' not found.",
            },
        )
    return {
        "success": True,
        "message": f"Shipment '{deleted.trackingNumber}' deleted successfully.",
        "data": {
            "id": deleted.id,
            "trackingNumber": deleted.trackingNumber,
            "recipient": deleted.recipient,
            "destinationCity": deleted.destinationCity,
        },
    }


@router.post("/reset")
def reset_shipments(service: ShipmentService = Depends(get_shipment_service)):
    total = service.reset_shipments()
    return {
        "success": True,
        "message": f"Data successfully reset to the {total} initial shipments.",
        "total": total,
    }