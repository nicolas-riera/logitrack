import json
from pathlib import Path
from custom_backend.models.shipment import Shipment

class ShipmentRepository:
    def __init__(
        self,
        db_path: str = "custom_backend/data/shipments.json",
        seed_path: str = "custom_backend/data/seed_shipments.json",
    ) -> None:
        self.db_path = Path(db_path)
        self.seed_path = Path(seed_path)
        self._ensure_initialized()

    def _ensure_initialized(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.db_path.exists():
            seed_data = self._read_seed()
            self._write_raw(seed_data)

    def _read_seed(self) -> list[dict]:
        if self.seed_path.exists():
            return json.loads(self.seed_path.read_text(encoding="utf-8"))
        return []

    def _read_raw(self) -> list[dict]:
        content = self.db_path.read_text(encoding="utf-8").strip()
        if not content:
            return []
        return json.loads(content)

    def _write_raw(self, records: list[dict]) -> None:
        self.db_path.write_text(
            json.dumps(records, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def find_all(self) -> list[Shipment]:
        return [Shipment(**raw) for raw in self._read_raw()]

    def find_by_id(self, shipment_id: str) -> Shipment | None:
        for raw in self._read_raw():
            if raw["id"] == shipment_id:
                return Shipment(**raw)
        return None

    def save(self, shipment: Shipment) -> Shipment:
        records = self._read_raw()
        records.append(shipment.model_dump())
        self._write_raw(records)
        return shipment

    def update(self, shipment_id: str, updated: Shipment) -> Shipment | None:
        records = self._read_raw()
        for idx, raw in enumerate(records):
            if raw["id"] == shipment_id:
                records[idx] = updated.model_dump()
                self._write_raw(records)
                return updated
        return None

    def delete(self, shipment_id: str) -> Shipment | None:
        records = self._read_raw()
        target: Shipment | None = None
        remaining: list[dict] = []
        for raw in records:
            if raw["id"] == shipment_id and target is None:
                target = Shipment(**raw)
            else:
                remaining.append(raw)
        if target is None:
            return None
        self._write_raw(remaining)
        return target

    def reset_to_seed(self) -> int:
        seed_data = self._read_seed()
        self._write_raw(seed_data)
        return len(seed_data)