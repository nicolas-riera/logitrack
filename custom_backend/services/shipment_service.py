import uuid
from custom_backend.models.shipment import Shipment, ShipmentCreate, ShipmentUpdate, StatusType
from custom_backend.repository.shipment_repository import ShipmentRepository

class ShipmentService:
    def __init__(self, repository: ShipmentRepository) -> None:
        self.repository = repository

    def list_shipments(
        self,
        search: str | None = None,
        status: StatusType | None = None,
    ) -> list[Shipment]:
        items = self.repository.find_all()
        if status is not None:
            items = [item for item in items if item.status == status]
        if search:
            needle = search.strip().lower()
            items = [
                item
                for item in items
                if needle in item.trackingNumber.lower()
                or needle in item.recipient.lower()
                or needle in item.destinationCity.lower()
            ]
        return items

    def get_shipment(self, shipment_id: str) -> Shipment | None:
        return self.repository.find_by_id(shipment_id)

    def create_shipment(self, payload: ShipmentCreate) -> Shipment:
        shipment_id = f"shp-{uuid.uuid4().hex[:6]}"
        shipment = payload.to_shipment(shipment_id)
        return self.repository.save(shipment)

    def update_shipment(self, shipment_id: str, payload: ShipmentUpdate) -> Shipment | None:
        current = self.repository.find_by_id(shipment_id)
        if current is None:
            return None
        updates = payload.model_dump(exclude_unset=True)
        updated = current.model_copy(update=updates)
        return self.repository.update(shipment_id, updated)

    def delete_shipment(self, shipment_id: str) -> Shipment | None:
        return self.repository.delete(shipment_id)

    def reset_shipments(self) -> int:
        return self.repository.reset_to_seed()