from datetime import datetime, timedelta, timezone
import random
from typing import Literal
from pydantic import BaseModel, Field

CarrierType = Literal["DHL", "Chronopost", "FedEx", "UPS"]
StatusType = Literal["IN_TRANSIT", "DELIVERED", "DELAYED", "PENDING"]

class Shipment(BaseModel):
    id: str
    trackingNumber: str
    recipient: str = Field(..., min_length=1)
    destinationCity: str = Field(..., min_length=1)
    carrier: CarrierType
    status: StatusType = "PENDING"
    departureDate: str
    estimatedDelivery: str | None = None
    isPriority: bool = False
    internalNotes: str = ""

class ShipmentCreate(BaseModel):
    trackingNumber: str | None = None
    recipient: str = Field(..., min_length=1)
    destinationCity: str = Field(..., min_length=1)
    carrier: CarrierType
    status: StatusType = "PENDING"
    departureDate: str | None = None
    estimatedDelivery: str | None = None
    isPriority: bool = False
    internalNotes: str = ""

    def to_shipment(self, shipment_id: str) -> Shipment:
        now = datetime.now(timezone.utc)
        tracking = self.trackingNumber or f"TRK-{random.randint(1000, 9999)}-FR"
        departure = self.departureDate or now.isoformat().replace("+00:00", "Z")
        estimated = self.estimatedDelivery or (now + timedelta(days=3)).isoformat().replace("+00:00", "Z")
        return Shipment(
            id=shipment_id,
            trackingNumber=tracking,
            recipient=self.recipient,
            destinationCity=self.destinationCity,
            carrier=self.carrier,
            status=self.status,
            departureDate=departure,
            estimatedDelivery=estimated,
            isPriority=self.isPriority,
            internalNotes=self.internalNotes,
        )

class ShipmentUpdate(BaseModel):
    trackingNumber: str | None = None
    recipient: str | None = Field(default=None, min_length=1)
    destinationCity: str | None = Field(default=None, min_length=1)
    carrier: CarrierType | None = None
    status: StatusType | None = None
    departureDate: str | None = None
    estimatedDelivery: str | None = None
    isPriority: bool | None = None
    internalNotes: str | None = None