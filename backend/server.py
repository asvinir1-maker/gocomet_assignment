from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import csv
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class JourneyLeg(BaseModel):
    leg_id: str
    sequence: int
    mode: Literal["road", "ocean", "air"]
    carrier: str
    vehicle_ref: str  # truck plate / vessel name+voyage / flight number
    from_location: str
    from_code: str
    to_location: str
    to_code: str
    departure: str   # ISO date
    arrival: str     # ISO date
    status: Literal["completed", "in_transit", "scheduled", "delayed"]
    notes: Optional[str] = None
    bl_number: Optional[str] = None     # Ocean Bill of Lading
    awb_number: Optional[str] = None    # Air Waybill


class LinkedOrder(BaseModel):
    order_number: str
    customer_name: str
    city: str
    product: str
    status: Literal["active", "completed", "delayed", "scheduled"]


class Shipment(BaseModel):
    id: str
    reference: str
    consignor: str
    consignee: str
    origin: str
    destination: str
    origin_country: str
    destination_country: str
    status: Literal["active", "completed", "delayed", "scheduled"]
    eta: str
    progress: int  # 0-100
    modes: List[Literal["road", "ocean", "air"]]
    weight_kg: float
    container_count: int
    booking_date: str
    legs: List[JourneyLeg]
    # Optional metadata for customer-facing or consolidated shipments
    audience: Literal["shipper", "customer"] = "shipper"
    customer_name: Optional[str] = None
    customer_city: Optional[str] = None
    product: Optional[str] = None
    order_number: Optional[str] = None
    parent_shipment_id: Optional[str] = None
    linked_orders: Optional[List[LinkedOrder]] = None
    delay_days: int = 0  # number of days delayed beyond originally promised ETA


# ---------- Mock Data ----------
SHIPMENTS: List[dict] = [
    {
        "id": "SHP-2025-1042",
        "reference": "PO-88421-A",
        "consignor": "Shenzhen Apex Electronics Co.",
        "consignee": "Pacific Rim Distribution LLC",
        "origin": "Shenzhen, China",
        "destination": "Los Angeles, USA",
        "origin_country": "CN",
        "destination_country": "US",
        "status": "active",
        "eta": "2025-12-22",
        "progress": 62,
        "modes": ["road", "ocean", "road"],
        "weight_kg": 18420.5,
        "container_count": 1,
        "booking_date": "2025-11-08",
        "legs": [
            {
                "leg_id": "L1", "sequence": 1, "mode": "road",
                "carrier": "Sinotrans Logistics",
                "vehicle_ref": "TRK-粤B-9X42",
                "from_location": "Apex Factory, Bao'an", "from_code": "SZX-FAC",
                "to_location": "Yantian Port", "to_code": "CNYTN",
                "departure": "2025-11-09T08:00:00Z",
                "arrival": "2025-11-09T14:30:00Z",
                "status": "completed",
                "notes": "Customs cleared at port gate.",
            },
            {
                "leg_id": "L2", "sequence": 2, "mode": "ocean",
                "carrier": "Maersk Line",
                "vehicle_ref": "MV EVER GIVEN / V.245W",
                "from_location": "Yantian Port", "from_code": "CNYTN",
                "to_location": "Long Beach Port", "to_code": "USLGB",
                "departure": "2025-11-12T22:00:00Z",
                "arrival": "2025-12-19T06:00:00Z",
                "status": "in_transit",
                "notes": "Vessel currently 1,850 nm from destination.",
                "bl_number": "MAEU-245W-7710321",
            },
            {
                "leg_id": "L3", "sequence": 3, "mode": "road",
                "carrier": "USA Trucking Inc.",
                "vehicle_ref": "TRK-CA-LB7821",
                "from_location": "Long Beach Port", "from_code": "USLGB",
                "to_location": "Pacific Rim DC, Los Angeles", "to_code": "LAX-DC1",
                "departure": "2025-12-19T14:00:00Z",
                "arrival": "2025-12-22T17:00:00Z",
                "status": "scheduled",
                "notes": "Drayage scheduled post discharge.",
            },
        ],
    },
    {
        "id": "SHP-2025-2081",
        "reference": "PO-77310-B",
        "consignor": "BMW Werk München",
        "consignee": "Northeast Auto Parts NJ",
        "origin": "Munich, Germany",
        "destination": "Newark, USA",
        "origin_country": "DE",
        "destination_country": "US",
        "status": "completed",
        "eta": "2025-11-30",
        "progress": 100,
        "modes": ["road", "air", "road"],
        "weight_kg": 2840.0,
        "container_count": 0,
        "booking_date": "2025-11-25",
        "legs": [
            {
                "leg_id": "L1", "sequence": 1, "mode": "road",
                "carrier": "DB Schenker",
                "vehicle_ref": "TRK-M-AC2901",
                "from_location": "BMW Plant, Munich", "from_code": "MUC-FAC",
                "to_location": "Frankfurt Airport Cargo", "to_code": "FRA",
                "departure": "2025-11-26T05:00:00Z",
                "arrival": "2025-11-26T11:45:00Z",
                "status": "completed",
            },
            {
                "leg_id": "L2", "sequence": 2, "mode": "air",
                "carrier": "Lufthansa Cargo",
                "vehicle_ref": "LH-8164 (B777F)",
                "from_location": "Frankfurt Airport", "from_code": "FRA",
                "to_location": "JFK International Airport", "to_code": "JFK",
                "departure": "2025-11-27T22:30:00Z",
                "arrival": "2025-11-28T03:50:00Z",
                "status": "completed",
                "awb_number": "020-77881664",
            },
            {
                "leg_id": "L3", "sequence": 3, "mode": "road",
                "carrier": "XPO Logistics",
                "vehicle_ref": "TRK-NJ-4421",
                "from_location": "JFK Airport", "from_code": "JFK",
                "to_location": "Northeast Auto DC, Newark", "to_code": "EWR-DC",
                "departure": "2025-11-29T09:00:00Z",
                "arrival": "2025-11-30T13:00:00Z",
                "status": "completed",
            },
        ],
    },
    {
        "id": "SHP-2025-3155",
        "reference": "PO-99020-C",
        "consignor": "Reliance Textiles, Mumbai",
        "consignee": "Midwest Apparel Group",
        "origin": "Mumbai, India",
        "destination": "Chicago, USA",
        "origin_country": "IN",
        "destination_country": "US",
        "status": "active",
        "eta": "2026-01-08",
        "progress": 45,
        "modes": ["road", "ocean", "air", "road"],
        "weight_kg": 9650.0,
        "container_count": 1,
        "booking_date": "2025-11-20",
        "legs": [
            {
                "leg_id": "L1", "sequence": 1, "mode": "road",
                "carrier": "TCI Express",
                "vehicle_ref": "TRK-MH-04-TY331",
                "from_location": "Reliance Mill, Mumbai", "from_code": "BOM-FAC",
                "to_location": "Nhava Sheva Port", "to_code": "INNSA",
                "departure": "2025-11-21T07:00:00Z",
                "arrival": "2025-11-21T15:00:00Z",
                "status": "completed",
            },
            {
                "leg_id": "L2", "sequence": 2, "mode": "ocean",
                "carrier": "MSC Mediterranean",
                "vehicle_ref": "MSC AURORA / V.118E",
                "from_location": "Nhava Sheva Port", "from_code": "INNSA",
                "to_location": "Rotterdam Port", "to_code": "NLRTM",
                "departure": "2025-11-23T18:00:00Z",
                "arrival": "2025-12-22T04:00:00Z",
                "status": "in_transit",
                "notes": "Suez canal crossing scheduled Dec 8.",
                "bl_number": "MEDU-118E-3320915",
            },
            {
                "leg_id": "L3", "sequence": 3, "mode": "air",
                "carrier": "KLM Cargo",
                "vehicle_ref": "KL-8615 (B747-400F)",
                "from_location": "Amsterdam Schiphol", "from_code": "AMS",
                "to_location": "Chicago O'Hare", "to_code": "ORD",
                "departure": "2026-01-04T22:15:00Z",
                "arrival": "2026-01-05T02:45:00Z",
                "status": "scheduled",
                "notes": "Ocean-to-air transfer at Rotterdam ➜ Schiphol.",
            },
            {
                "leg_id": "L4", "sequence": 4, "mode": "road",
                "carrier": "Old Dominion Freight",
                "vehicle_ref": "TRK-IL-77YH3",
                "from_location": "ORD Airport Cargo", "from_code": "ORD",
                "to_location": "Midwest Apparel DC, Naperville", "to_code": "ORD-DC",
                "departure": "2026-01-06T10:00:00Z",
                "arrival": "2026-01-08T16:00:00Z",
                "status": "scheduled",
            },
        ],
    },
    {
        "id": "SHP-2025-4209",
        "reference": "PO-65512-D",
        "consignor": "Singapore Polymers Pte Ltd",
        "consignee": "Aussie Plastics Sydney",
        "origin": "Singapore",
        "destination": "Sydney, Australia",
        "origin_country": "SG",
        "destination_country": "AU",
        "status": "delayed",
        "eta": "2025-12-30",
        "progress": 78,
        "modes": ["ocean", "road"],
        "weight_kg": 22100.0,
        "container_count": 2,
        "booking_date": "2025-11-02",
        "delay_days": 12,
        "legs": [
            {
                "leg_id": "L1", "sequence": 1, "mode": "ocean",
                "carrier": "ONE - Ocean Network Express",
                "vehicle_ref": "ONE TRADITION / V.022S",
                "from_location": "Port of Singapore", "from_code": "SGSIN",
                "to_location": "Port Botany, Sydney", "to_code": "AUSYD",
                "departure": "2025-11-05T20:00:00Z",
                "arrival": "2025-12-15T08:00:00Z",
                "status": "completed",
                "notes": "Vessel delayed 4 days at Singapore.",
                "bl_number": "ONEY-022S-4421809",
            },
            {
                "leg_id": "L2", "sequence": 2, "mode": "road",
                "carrier": "Toll Group",
                "vehicle_ref": "TRK-NSW-AP4419",
                "from_location": "Port Botany", "from_code": "AUSYD",
                "to_location": "Aussie Plastics, Sydney", "to_code": "SYD-DC",
                "departure": "2025-12-18T09:00:00Z",
                "arrival": "2025-12-30T14:00:00Z",
                "status": "delayed",
                "notes": "Customs hold — paperwork pending. ETA pushed.",
            },
        ],
    },
    # ----------- TechNova Laptop case: shipper consolidated + 2 customer orders -----------
    {
        "id": "SHP-2025-5500",
        "reference": "PO-TN-IN-CONS-001",
        "consignor": "TechNova Computing Inc., Austin TX",
        "consignee": "TechNova India Distribution Hub, Gurugram",
        "origin": "Austin, USA",
        "destination": "Gurugram, India",
        "origin_country": "US",
        "destination_country": "IN",
        "status": "active",
        "eta": "2026-01-18",
        "progress": 38,
        "modes": ["road", "ocean", "road"],
        "weight_kg": 14250.0,
        "container_count": 1,
        "booking_date": "2025-11-12",
        "audience": "shipper",
        "linked_orders": [
            {
                "order_number": "ORD-IN-7821",
                "customer_name": "Rahul Sharma",
                "city": "Bengaluru",
                "product": "TechNova UltraBook 14 Pro",
                "status": "active",
            },
            {
                "order_number": "ORD-IN-7822",
                "customer_name": "Priya Mehta",
                "city": "Jaipur",
                "product": "TechNova UltraBook 13 Air",
                "status": "active",
            },
        ],
        "legs": [
            {
                "leg_id": "L1", "sequence": 1, "mode": "road",
                "carrier": "JB Hunt Transport",
                "vehicle_ref": "TRK-TX-AU3142",
                "from_location": "TechNova Warehouse, Austin", "from_code": "AUS-WH",
                "to_location": "Port of Houston", "to_code": "USHOU",
                "departure": "2025-11-14T06:00:00Z",
                "arrival": "2025-11-14T13:30:00Z",
                "status": "completed",
                "notes": "Container TCNU-7821044 picked up at warehouse.",
            },
            {
                "leg_id": "L2", "sequence": 2, "mode": "ocean",
                "carrier": "Maersk Line",
                "vehicle_ref": "MV MAERSK HOUSTON / V.547W",
                "from_location": "Port of Houston", "from_code": "USHOU",
                "to_location": "Mundra Port, Gujarat", "to_code": "INMUN",
                "departure": "2025-11-18T22:00:00Z",
                "arrival": "2026-01-04T07:00:00Z",
                "status": "in_transit",
                "notes": "Vessel transiting Cape of Good Hope; ETA Mundra unchanged.",
                "bl_number": "MAEU-547W-9821044",
            },
            {
                "leg_id": "L3", "sequence": 3, "mode": "road",
                "carrier": "TCI Freight (Customs + Drayage)",
                "vehicle_ref": "TRK-GJ-09-MN8821",
                "from_location": "Mundra Port (Customs)", "from_code": "INMUN",
                "to_location": "TechNova India Hub, Gurugram", "to_code": "GUR-DC",
                "departure": "2026-01-08T09:00:00Z",
                "arrival": "2026-01-18T18:00:00Z",
                "status": "scheduled",
                "notes": "Customs clearance + 1,150 km haul to Gurugram DC.",
            },
        ],
    },
    {
        "id": "ORD-IN-7821",
        "reference": "TN-ORDER-7821",
        "consignor": "TechNova Computing Inc.",
        "consignee": "Rahul Sharma",
        "origin": "Austin, USA",
        "destination": "Bengaluru, India",
        "origin_country": "US",
        "destination_country": "IN",
        "status": "active",
        "eta": "2026-01-22",
        "progress": 35,
        "modes": ["road", "ocean", "road", "road"],
        "weight_kg": 2.1,
        "container_count": 0,
        "booking_date": "2025-11-10",
        "audience": "customer",
        "customer_name": "Rahul Sharma",
        "customer_city": "Bengaluru",
        "product": "TechNova UltraBook 14 Pro (Space Grey, 16GB / 1TB)",
        "order_number": "ORD-IN-7821",
        "parent_shipment_id": "SHP-2025-5500",
        "legs": [
            {
                "leg_id": "L1", "sequence": 1, "mode": "road",
                "carrier": "JB Hunt Transport",
                "vehicle_ref": "TRK-TX-AU3142",
                "from_location": "TechNova Warehouse, Austin", "from_code": "AUS-WH",
                "to_location": "Port of Houston", "to_code": "USHOU",
                "departure": "2025-11-14T06:00:00Z",
                "arrival": "2025-11-14T13:30:00Z",
                "status": "completed",
                "notes": "Shipped from factory.",
            },
            {
                "leg_id": "L2", "sequence": 2, "mode": "ocean",
                "carrier": "Maersk Line",
                "vehicle_ref": "MV MAERSK HOUSTON / V.547W",
                "from_location": "Port of Houston", "from_code": "USHOU",
                "to_location": "Mundra Port, India", "to_code": "INMUN",
                "departure": "2025-11-18T22:00:00Z",
                "arrival": "2026-01-04T07:00:00Z",
                "status": "in_transit",
                "notes": "On the high seas — international transit.",
                "bl_number": "MAEU-547W-9821044",
            },
            {
                "leg_id": "L3", "sequence": 3, "mode": "road",
                "carrier": "VRL Logistics",
                "vehicle_ref": "TRK-GJ-09-VR4471",
                "from_location": "Mundra Port (Customs)", "from_code": "INMUN",
                "to_location": "Bengaluru BLR Hub", "to_code": "BLR-HUB",
                "departure": "2026-01-08T09:00:00Z",
                "arrival": "2026-01-20T18:00:00Z",
                "status": "scheduled",
                "notes": "Customs clearance + 1,850 km surface haul to Bengaluru.",
            },
            {
                "leg_id": "L4", "sequence": 4, "mode": "road",
                "carrier": "Delhivery Express",
                "vehicle_ref": "VAN-KA-01-DE9117",
                "from_location": "Bengaluru BLR Hub", "from_code": "BLR-HUB",
                "to_location": "Indiranagar, Bengaluru", "to_code": "BLR-HOME",
                "departure": "2026-01-22T08:00:00Z",
                "arrival": "2026-01-22T15:00:00Z",
                "status": "scheduled",
                "notes": "Out for delivery.",
            },
        ],
    },
    {
        "id": "ORD-IN-7822",
        "reference": "TN-ORDER-7822",
        "consignor": "TechNova Computing Inc.",
        "consignee": "Priya Mehta",
        "origin": "Austin, USA",
        "destination": "Jaipur, India",
        "origin_country": "US",
        "destination_country": "IN",
        "status": "active",
        "eta": "2026-01-21",
        "progress": 35,
        "modes": ["road", "ocean", "road", "road"],
        "weight_kg": 1.8,
        "container_count": 0,
        "booking_date": "2025-11-10",
        "audience": "customer",
        "customer_name": "Priya Mehta",
        "customer_city": "Jaipur",
        "product": "TechNova UltraBook 13 Air (Silver, 16GB / 512GB)",
        "order_number": "ORD-IN-7822",
        "parent_shipment_id": "SHP-2025-5500",
        "legs": [
            {
                "leg_id": "L1", "sequence": 1, "mode": "road",
                "carrier": "JB Hunt Transport",
                "vehicle_ref": "TRK-TX-AU3142",
                "from_location": "TechNova Warehouse, Austin", "from_code": "AUS-WH",
                "to_location": "Port of Houston", "to_code": "USHOU",
                "departure": "2025-11-14T06:00:00Z",
                "arrival": "2025-11-14T13:30:00Z",
                "status": "completed",
                "notes": "Shipped from factory.",
            },
            {
                "leg_id": "L2", "sequence": 2, "mode": "ocean",
                "carrier": "Maersk Line",
                "vehicle_ref": "MV MAERSK HOUSTON / V.547W",
                "from_location": "Port of Houston", "from_code": "USHOU",
                "to_location": "Mundra Port, India", "to_code": "INMUN",
                "departure": "2025-11-18T22:00:00Z",
                "arrival": "2026-01-04T07:00:00Z",
                "status": "in_transit",
                "notes": "On the high seas — international transit.",
                "bl_number": "MAEU-547W-9821044",
            },
            {
                "leg_id": "L3", "sequence": 3, "mode": "road",
                "carrier": "TCI Freight",
                "vehicle_ref": "TRK-GJ-09-MN8821",
                "from_location": "Mundra Port", "from_code": "INMUN",
                "to_location": "TechNova India Hub, Gurugram", "to_code": "GUR-DC",
                "departure": "2026-01-08T09:00:00Z",
                "arrival": "2026-01-18T18:00:00Z",
                "status": "scheduled",
                "notes": "Customs clearance + transfer to India hub.",
            },
            {
                "leg_id": "L4", "sequence": 4, "mode": "road",
                "carrier": "BlueDart Surface Express",
                "vehicle_ref": "VAN-RJ-14-BD2204",
                "from_location": "Gurugram Hub", "from_code": "GUR-DC",
                "to_location": "C-Scheme, Jaipur", "to_code": "JAI-HOME",
                "departure": "2026-01-20T07:00:00Z",
                "arrival": "2026-01-21T16:00:00Z",
                "status": "scheduled",
                "notes": "Out for delivery (270 km surface route).",
            },
        ],
    },
]


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Logistics Tracker API"}


@api_router.get("/shipments", response_model=List[Shipment])
async def list_shipments(status: Optional[str] = None, audience: Optional[str] = None):
    items = SHIPMENTS
    if audience and audience in ("shipper", "customer"):
        items = [s for s in items if s.get("audience", "shipper") == audience]
    if status and status != "all":
        items = [s for s in items if s["status"] == status]
    return items


@api_router.get("/shipments/{shipment_id}", response_model=Shipment)
async def get_shipment(shipment_id: str):
    sid = shipment_id.strip().upper()
    for s in SHIPMENTS:
        if s["id"].upper() == sid or s["reference"].upper() == sid:
            return s
    raise HTTPException(status_code=404, detail=f"Shipment '{shipment_id}' not found")


@api_router.get("/orders/{order_number}", response_model=Shipment)
async def get_order(order_number: str):
    """Customer-facing order lookup. Accepts order_number or shipment id."""
    oid = order_number.strip().upper()
    for s in SHIPMENTS:
        if s.get("audience") != "customer":
            continue
        if (s["id"].upper() == oid
                or (s.get("order_number") or "").upper() == oid
                or s["reference"].upper() == oid):
            return s
    raise HTTPException(status_code=404, detail=f"Order '{order_number}' not found")


class ReverseMatch(BaseModel):
    shipment_id: str
    audience: str
    reference: str
    consignor: str
    consignee: str
    origin: str
    destination: str
    origin_country: str
    destination_country: str
    status: str
    eta: str
    progress: int
    modes: List[str]
    matched_leg: JourneyLeg
    matched_field: Literal["bl_number", "awb_number", "vehicle_ref"]


class ReverseSearchResponse(BaseModel):
    query: str
    count: int
    matches: List[ReverseMatch]


@api_router.get("/reverse-search", response_model=ReverseSearchResponse)
async def reverse_search(q: str):
    """Reverse-search shipments by Bill of Lading (B/L), Air Waybill (AWB),
    or vehicle/vessel/flight reference. Returns ALL matching shipments —
    useful when a single B/L covers multiple consolidated shipments."""
    needle = (q or "").strip().upper()
    if not needle:
        raise HTTPException(status_code=400, detail="Query must not be empty")

    matches: List[dict] = []
    for s in SHIPMENTS:
        for leg in s.get("legs", []):
            bl = (leg.get("bl_number") or "").upper()
            awb = (leg.get("awb_number") or "").upper()
            vref = (leg.get("vehicle_ref") or "").upper()
            field = None
            if bl and needle in bl: field = "bl_number"
            elif awb and needle in awb: field = "awb_number"
            elif vref and needle in vref: field = "vehicle_ref"
            if field:
                matches.append({
                    "shipment_id": s["id"],
                    "audience": s.get("audience", "shipper"),
                    "reference": s["reference"],
                    "consignor": s["consignor"],
                    "consignee": s["consignee"],
                    "origin": s["origin"],
                    "destination": s["destination"],
                    "origin_country": s["origin_country"],
                    "destination_country": s["destination_country"],
                    "status": s["status"],
                    "eta": s["eta"],
                    "progress": s["progress"],
                    "modes": s["modes"],
                    "matched_leg": leg,
                    "matched_field": field,
                })
                break  # one match per shipment

    return {"query": q, "count": len(matches), "matches": matches}


# ============================================================
# ERP Integrations + Order Docs (PO/SO)
# ============================================================
class ERPIntegration(BaseModel):
    id: str
    provider: str          # SAP S/4HANA, Oracle NetSuite, ...
    name: str              # user-given name
    endpoint: Optional[str] = None
    environment: Optional[str] = None  # production / sandbox
    status: Literal["connected", "disconnected", "error"] = "connected"
    last_sync: Optional[str] = None
    record_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ERPCreate(BaseModel):
    provider: str
    name: str
    endpoint: Optional[str] = None
    environment: Optional[str] = "production"
    api_key: Optional[str] = None  # not stored in returned object; mock


class OrderDoc(BaseModel):
    id: str
    doc_type: Literal["PO", "SO"]
    doc_number: str
    party: str             # supplier (PO) or customer (SO)
    shipment_id: str       # link to existing shipment or order
    value_usd: float = 0.0
    order_date: str        # ISO date
    description: Optional[str] = None
    source: Literal["erp", "upload", "seed"] = "seed"
    integration_id: Optional[str] = None
    valid: bool = True
    error: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


INTEGRATIONS: List[dict] = [
    {
        "id": "INT-001",
        "provider": "SAP S/4HANA",
        "name": "Production SAP",
        "endpoint": "https://sap.technova.example.com/odata/v2",
        "environment": "production",
        "status": "connected",
        "last_sync": "2026-01-12T08:30:00Z",
        "record_count": 4,
        "created_at": "2025-10-01T10:00:00Z",
    },
    {
        "id": "INT-002",
        "provider": "Oracle NetSuite",
        "name": "NetSuite Sandbox",
        "endpoint": "https://1234567-sb1.suitetalk.api.netsuite.com",
        "environment": "sandbox",
        "status": "disconnected",
        "last_sync": None,
        "record_count": 0,
        "created_at": "2025-11-10T14:20:00Z",
    },
]

SUPPORTED_PROVIDERS = [
    "SAP S/4HANA", "Oracle NetSuite", "MS Dynamics 365",
    "Odoo", "Zoho Inventory", "Custom REST API",
]

ORDER_DOCS: List[dict] = [
    {"id": "DOC-1", "doc_type": "PO", "doc_number": "PO-FAB-2024-091",
     "party": "Foxconn Electronics", "shipment_id": "SHP-2025-5500",
     "value_usd": 342500.0, "order_date": "2025-10-22",
     "description": "Laptop chassis & display assemblies (1,250 units)",
     "source": "erp", "integration_id": "INT-001", "valid": True, "error": None,
     "created_at": "2025-10-22T08:00:00Z"},
    {"id": "DOC-2", "doc_type": "PO", "doc_number": "PO-CHIP-2024-156",
     "party": "Intel Semiconductor", "shipment_id": "SHP-2025-5500",
     "value_usd": 128000.0, "order_date": "2025-10-25",
     "description": "Core i7 / i9 CPUs (1,250 units)",
     "source": "erp", "integration_id": "INT-001", "valid": True, "error": None,
     "created_at": "2025-10-25T08:00:00Z"},
    {"id": "DOC-3", "doc_type": "SO", "doc_number": "SO-CUST-7821",
     "party": "Rahul Sharma", "shipment_id": "ORD-IN-7821",
     "value_usd": 1899.0, "order_date": "2025-11-08",
     "description": "TechNova UltraBook 14 Pro · 1 unit",
     "source": "erp", "integration_id": "INT-001", "valid": True, "error": None,
     "created_at": "2025-11-08T08:00:00Z"},
    {"id": "DOC-4", "doc_type": "SO", "doc_number": "SO-CUST-7822",
     "party": "Priya Mehta", "shipment_id": "ORD-IN-7822",
     "value_usd": 1499.0, "order_date": "2025-11-08",
     "description": "TechNova UltraBook 13 Air · 1 unit",
     "source": "erp", "integration_id": "INT-001", "valid": True, "error": None,
     "created_at": "2025-11-08T08:00:00Z"},
    {"id": "DOC-5", "doc_type": "PO", "doc_number": "PO-AUTO-DE-401",
     "party": "ZF Friedrichshafen AG", "shipment_id": "SHP-2025-2081",
     "value_usd": 89200.0, "order_date": "2025-11-22",
     "description": "8HP transmissions (40 units)",
     "source": "seed", "integration_id": None, "valid": True, "error": None,
     "created_at": "2025-11-22T08:00:00Z"},
    {"id": "DOC-6", "doc_type": "SO", "doc_number": "SO-NJ-DC-7711",
     "party": "Northeast Auto Parts NJ", "shipment_id": "SHP-2025-2081",
     "value_usd": 112400.0, "order_date": "2025-11-25",
     "description": "Transmission resale to Newark DC",
     "source": "seed", "integration_id": None, "valid": True, "error": None,
     "created_at": "2025-11-25T08:00:00Z"},
    {"id": "DOC-7", "doc_type": "PO", "doc_number": "PO-TEX-2024-22",
     "party": "Gujarat Cotton Mills", "shipment_id": "SHP-2025-3155",
     "value_usd": 45800.0, "order_date": "2025-11-15",
     "description": "Premium cotton bales (12,000 kg)",
     "source": "seed", "integration_id": None, "valid": True, "error": None,
     "created_at": "2025-11-15T08:00:00Z"},
    {"id": "DOC-8", "doc_type": "SO", "doc_number": "SO-MID-IL-19",
     "party": "Midwest Apparel Group", "shipment_id": "SHP-2025-3155",
     "value_usd": 234500.0, "order_date": "2025-11-18",
     "description": "Finished apparel SKUs (24 styles)",
     "source": "seed", "integration_id": None, "valid": True, "error": None,
     "created_at": "2025-11-18T08:00:00Z"},
]


def _valid_shipment_ids():
    return {s["id"] for s in SHIPMENTS}


def _new_doc_id() -> str:
    return f"DOC-{uuid.uuid4().hex[:8].upper()}"


def _new_int_id() -> str:
    return f"INT-{uuid.uuid4().hex[:6].upper()}"


# ----- Integrations endpoints -----
@api_router.get("/integrations/providers")
async def list_providers():
    return {"providers": SUPPORTED_PROVIDERS}


@api_router.get("/integrations", response_model=List[ERPIntegration])
async def list_integrations():
    return INTEGRATIONS


@api_router.post("/integrations", response_model=ERPIntegration)
async def create_integration(body: ERPCreate):
    if body.provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {body.provider}")
    rec = {
        "id": _new_int_id(),
        "provider": body.provider,
        "name": body.name,
        "endpoint": body.endpoint,
        "environment": body.environment or "production",
        "status": "connected",
        "last_sync": datetime.now(timezone.utc).isoformat(),
        "record_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    INTEGRATIONS.append(rec)
    return rec


@api_router.post("/integrations/{integration_id}/sync")
async def sync_integration(integration_id: str):
    for it in INTEGRATIONS:
        if it["id"].upper() == integration_id.upper():
            it["status"] = "connected"
            it["last_sync"] = datetime.now(timezone.utc).isoformat()
            # In real life this would pull new docs from the ERP. We just bump the count.
            new_count = sum(1 for d in ORDER_DOCS if d.get("integration_id") == it["id"])
            it["record_count"] = new_count
            return {"ok": True, "integration_id": it["id"], "synced_records": new_count, "last_sync": it["last_sync"]}
    raise HTTPException(status_code=404, detail="Integration not found")


@api_router.delete("/integrations/{integration_id}")
async def delete_integration(integration_id: str):
    global INTEGRATIONS
    before = len(INTEGRATIONS)
    INTEGRATIONS = [x for x in INTEGRATIONS if x["id"].upper() != integration_id.upper()]
    if len(INTEGRATIONS) == before:
        raise HTTPException(status_code=404, detail="Integration not found")
    return {"ok": True, "deleted": integration_id}


# ----- Order docs endpoints -----
@api_router.get("/orders-docs", response_model=List[OrderDoc])
async def list_order_docs(doc_type: Optional[str] = None, shipment_id: Optional[str] = None):
    items = ORDER_DOCS
    if doc_type and doc_type.upper() in ("PO", "SO"):
        items = [d for d in items if d["doc_type"] == doc_type.upper()]
    if shipment_id:
        items = [d for d in items if d["shipment_id"].upper() == shipment_id.upper()]
    return items


@api_router.get("/orders-docs/by-shipment/{shipment_id}", response_model=List[OrderDoc])
async def docs_by_shipment(shipment_id: str):
    sid = shipment_id.upper()
    return [d for d in ORDER_DOCS if d["shipment_id"].upper() == sid]


@api_router.get("/orders-docs/template", response_class=PlainTextResponse)
async def docs_template():
    """Return a CSV template users can fill in and re-upload."""
    rows = [
        ["doc_type", "doc_number", "party", "shipment_id", "value_usd", "order_date", "description"],
        ["PO", "PO-EXAMPLE-001", "Acme Supplies Co.", "SHP-2025-1042", "12500.00", "2025-12-01", "Example purchase order"],
        ["SO", "SO-EXAMPLE-001", "Acme Customer LLC", "SHP-2025-1042", "18900.00", "2025-12-02", "Example sales order"],
    ]
    out = io.StringIO()
    csv.writer(out).writerows(rows)
    return out.getvalue()


def _parse_upload(filename: str, raw: bytes) -> List[dict]:
    """Return list of row dicts from a CSV or XLSX upload."""
    name = (filename or "").lower()
    if name.endswith(".xlsx"):
        try:
            from openpyxl import load_workbook
        except ImportError:
            raise HTTPException(status_code=500, detail="openpyxl not installed")
        wb = load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            return []
        headers = [str(h or "").strip() for h in rows[0]]
        return [dict(zip(headers, r)) for r in rows[1:] if any(c not in (None, "") for c in r)]
    # CSV
    text = raw.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    return [dict(r) for r in reader]


@api_router.post("/orders-docs/upload")
async def upload_order_docs(file: UploadFile = File(...)):
    raw = await file.read()
    try:
        rows = _parse_upload(file.filename or "", raw)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {e}")

    valid_ids = _valid_shipment_ids()
    parsed: List[dict] = []
    valid_count = 0
    error_count = 0
    for r in rows:
        try:
            doc_type = (str(r.get("doc_type") or "")).upper().strip()
            doc_number = str(r.get("doc_number") or "").strip()
            party = str(r.get("party") or "").strip()
            shipment_id = str(r.get("shipment_id") or "").strip().upper()
            value_str = str(r.get("value_usd") or "0").strip()
            value_usd = float(value_str) if value_str else 0.0
            order_date = str(r.get("order_date") or "").strip() or datetime.now(timezone.utc).date().isoformat()
            description = (str(r.get("description") or "").strip()) or None

            errors = []
            if doc_type not in ("PO", "SO"): errors.append("doc_type must be PO or SO")
            if not doc_number: errors.append("doc_number is required")
            if not party: errors.append("party is required")
            if not shipment_id: errors.append("shipment_id is required")
            elif shipment_id not in valid_ids: errors.append(f"unknown shipment_id '{shipment_id}'")

            valid = len(errors) == 0
            doc = {
                "id": _new_doc_id(),
                "doc_type": doc_type or "PO",
                "doc_number": doc_number or "—",
                "party": party or "—",
                "shipment_id": shipment_id,
                "value_usd": value_usd,
                "order_date": order_date,
                "description": description,
                "source": "upload",
                "integration_id": None,
                "valid": valid,
                "error": "; ".join(errors) if errors else None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            parsed.append(doc)
            if valid:
                ORDER_DOCS.append(doc)
                valid_count += 1
            else:
                error_count += 1
        except Exception as e:
            error_count += 1
            parsed.append({
                "id": _new_doc_id(),
                "doc_type": "PO", "doc_number": "—", "party": "—",
                "shipment_id": "—", "value_usd": 0.0, "order_date": "",
                "description": None, "source": "upload",
                "integration_id": None, "valid": False, "error": f"row error: {e}",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    return {
        "filename": file.filename,
        "total_rows": len(rows),
        "imported": valid_count,
        "errors": error_count,
        "preview": parsed,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
