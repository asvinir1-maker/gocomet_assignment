"""Backend tests for logistics shipments API."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://journey-view-1.preview.emergentagent.com').rstrip('/')


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- list shipments ---
class TestListShipments:
    def test_list_returns_4(self, api):
        r = api.get(f"{BASE_URL}/api/shipments", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 4
        ids = {s["id"] for s in data}
        assert ids == {"SHP-2025-1042", "SHP-2025-2081", "SHP-2025-3155", "SHP-2025-4209"}

    def test_filter_active(self, api):
        r = api.get(f"{BASE_URL}/api/shipments?status=active", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert all(s["status"] == "active" for s in data)
        assert len(data) == 2

    def test_filter_completed(self, api):
        r = api.get(f"{BASE_URL}/api/shipments?status=completed", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert all(s["status"] == "completed" for s in data)

    def test_filter_delayed(self, api):
        r = api.get(f"{BASE_URL}/api/shipments?status=delayed", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert all(s["status"] == "delayed" for s in data)


# --- get shipment by id ---
class TestGetShipment:
    def test_get_3155_four_legs(self, api):
        r = api.get(f"{BASE_URL}/api/shipments/SHP-2025-3155", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == "SHP-2025-3155"
        assert len(data["legs"]) == 4
        modes = [leg["mode"] for leg in data["legs"]]
        assert modes == ["road", "ocean", "air", "road"]

    def test_get_1042_three_legs(self, api):
        r = api.get(f"{BASE_URL}/api/shipments/SHP-2025-1042", timeout=15)
        assert r.status_code == 200
        data = r.json()
        modes = [leg["mode"] for leg in data["legs"]]
        assert modes == ["road", "ocean", "road"]

    def test_get_2081_three_legs(self, api):
        r = api.get(f"{BASE_URL}/api/shipments/SHP-2025-2081", timeout=15)
        assert r.status_code == 200
        data = r.json()
        modes = [leg["mode"] for leg in data["legs"]]
        assert modes == ["road", "air", "road"]

    def test_get_invalid_404(self, api):
        r = api.get(f"{BASE_URL}/api/shipments/INVALID", timeout=15)
        assert r.status_code == 404
        assert "not found" in r.json().get("detail", "").lower()

    def test_lookup_by_reference(self, api):
        r = api.get(f"{BASE_URL}/api/shipments/PO-88421-A", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == "SHP-2025-1042"
        assert data["reference"] == "PO-88421-A"

    def test_lookup_case_insensitive(self, api):
        r = api.get(f"{BASE_URL}/api/shipments/shp-2025-3155", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == "SHP-2025-3155"
