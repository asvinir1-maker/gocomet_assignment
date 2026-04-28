"""Backend tests for logistics shipments + customer orders API."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- list shipments ---
class TestListShipments:
    def test_list_default_returns_all(self, api):
        r = api.get(f"{BASE_URL}/api/shipments", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # 4 original shipper + 1 consolidated shipper + 2 customer orders
        assert len(data) == 7

    def test_audience_shipper_returns_5(self, api):
        r = api.get(f"{BASE_URL}/api/shipments?audience=shipper", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 5
        ids = {s["id"] for s in data}
        assert ids == {
            "SHP-2025-1042", "SHP-2025-2081", "SHP-2025-3155",
            "SHP-2025-4209", "SHP-2025-5500",
        }
        for s in data:
            assert s.get("audience", "shipper") == "shipper"

    def test_audience_customer_returns_2(self, api):
        r = api.get(f"{BASE_URL}/api/shipments?audience=customer", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 2
        ids = {s["id"] for s in data}
        assert ids == {"ORD-IN-7821", "ORD-IN-7822"}
        for s in data:
            assert s["audience"] == "customer"

    def test_filter_active_default(self, api):
        r = api.get(f"{BASE_URL}/api/shipments?status=active", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert all(s["status"] == "active" for s in data)


# --- get shipment by id ---
class TestGetShipment:
    def test_consolidated_5500(self, api):
        r = api.get(f"{BASE_URL}/api/shipments/SHP-2025-5500", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == "SHP-2025-5500"
        assert len(data["legs"]) == 3
        modes = [leg["mode"] for leg in data["legs"]]
        assert modes == ["road", "ocean", "road"]
        # Houston -> Mundra ocean leg
        assert data["legs"][1]["mode"] == "ocean"
        assert "Houston" in data["legs"][1]["from_location"]
        assert "Mundra" in data["legs"][1]["to_location"]
        # Linked orders
        assert "linked_orders" in data and data["linked_orders"] is not None
        assert len(data["linked_orders"]) == 2
        order_nums = {lo["order_number"] for lo in data["linked_orders"]}
        assert order_nums == {"ORD-IN-7821", "ORD-IN-7822"}
        # Verify customer details
        rahul = next(lo for lo in data["linked_orders"] if lo["order_number"] == "ORD-IN-7821")
        assert rahul["customer_name"] == "Rahul Sharma"
        assert rahul["city"] == "Bengaluru"
        priya = next(lo for lo in data["linked_orders"] if lo["order_number"] == "ORD-IN-7822")
        assert priya["customer_name"] == "Priya Mehta"
        assert priya["city"] == "Jaipur"

    def test_get_invalid_404(self, api):
        r = api.get(f"{BASE_URL}/api/shipments/INVALID", timeout=15)
        assert r.status_code == 404

    def test_lookup_by_reference(self, api):
        r = api.get(f"{BASE_URL}/api/shipments/PO-88421-A", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == "SHP-2025-1042"


# --- get order by order_number (customer endpoint) ---
class TestGetOrder:
    def test_order_7821_five_legs(self, api):
        r = api.get(f"{BASE_URL}/api/orders/ORD-IN-7821", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["customer_name"] == "Rahul Sharma"
        assert data["customer_city"] == "Bengaluru"
        assert "UltraBook 14 Pro" in data["product"]
        assert len(data["legs"]) == 5
        modes = [l["mode"] for l in data["legs"]]
        assert modes == ["road", "ocean", "road", "air", "road"]
        # international leg should be ocean Houston->Mundra
        ocean = data["legs"][1]
        assert ocean["mode"] == "ocean"
        assert "Houston" in ocean["from_location"]
        assert "Mundra" in ocean["to_location"]
        # domestic india air DEL->BLR
        air = data["legs"][3]
        assert air["mode"] == "air"
        assert air["from_code"] == "DEL"
        assert air["to_code"] == "BLR"
        # last leg road BLR-HUB -> BLR-HOME
        last = data["legs"][4]
        assert last["mode"] == "road"
        assert last["from_code"] == "BLR-HUB"
        assert last["to_code"] == "BLR-HOME"

    def test_order_7822_four_legs_no_air(self, api):
        r = api.get(f"{BASE_URL}/api/orders/ORD-IN-7822", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["customer_name"] == "Priya Mehta"
        assert data["customer_city"] == "Jaipur"
        assert len(data["legs"]) == 4
        modes = [l["mode"] for l in data["legs"]]
        assert "air" not in modes
        # last leg ends with delivery to Jaipur via road
        last = data["legs"][-1]
        assert last["mode"] == "road"
        assert "Jaipur" in last["to_location"]

    def test_order_for_shipper_shipment_returns_404(self, api):
        r = api.get(f"{BASE_URL}/api/orders/SHP-2025-1042", timeout=15)
        assert r.status_code == 404

    def test_order_invalid_404(self, api):
        r = api.get(f"{BASE_URL}/api/orders/INVALID", timeout=15)
        assert r.status_code == 404
