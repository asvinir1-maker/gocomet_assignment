# UniRoute — Unified Multimodal Logistics Tracker

## Original Problem Statement
> Create a logistics view landing page similar to GoTrack but with a unified view for a shipment ID when punched in, so the whole journey involving applicable air, ocean and road modes are visible.
>
> **Iteration 2:** Add custom views for a shipper (company) vs an end customer (consumer). Mock case — TechNova laptop company in the US shipping to 2 Indian consignees (Bengaluru & Jaipur). International leg via OCEAN.

## User Personas
- **Shipper (B2B operations)** — needs dense, multi-leg visibility, customs/vessel/voyage details, linked customer orders for consolidated shipments.
- **End Customer (B2C)** — wants a friendly "Where is my package?" tracker with milestone status (Shipped → International Transit → Arrived → Out for Delivery → Delivered).

## Core Architecture
### Backend (FastAPI)
- `GET /api/shipments?status=&audience=` — list (audience: shipper|customer)
- `GET /api/shipments/{id_or_reference}` — full shipper detail (case-insensitive)
- `GET /api/orders/{order_number}` — customer-only lookup (404 for shipper IDs)
- Mock data only; in-memory list `SHIPMENTS`.

### Frontend (React 19 + Tailwind + lucide-react + sonner)
- Routes: `/`, `/shipment/:id`, `/order/:orderNo`
- Components: `Sidebar`, `ViewToggle`, `HeroSearch` (audience-aware), `MultimodalTimeline`, `CustomerTimeline`, `ShipmentCard`, `LinkedOrdersPanel`, `StatusBadge`, `ModeIcon`
- Typography: Cabinet Grotesk (display) / IBM Plex Sans (body) / JetBrains Mono (data)

## Mock Shipments
| ID | Audience | Route | Modes | Status |
|---|---|---|---|---|
| SHP-2025-1042 | shipper | Shenzhen → Los Angeles | road · ocean · road | Active |
| SHP-2025-2081 | shipper | Munich → Newark | road · air · road | Completed |
| SHP-2025-3155 | shipper | Mumbai → Chicago | road · ocean · air · road | Active |
| SHP-2025-4209 | shipper | Singapore → Sydney | ocean · road | Delayed |
| **SHP-2025-5500** | shipper | Austin → Gurugram (consolidated, 2 linked orders) | road · ocean · road | Active |
| **ORD-IN-7821** | customer | Austin → Bengaluru (Rahul Sharma, UltraBook 14 Pro) | road · ocean · road · air · road | Active |
| **ORD-IN-7822** | customer | Austin → Jaipur (Priya Mehta, UltraBook 13 Air) | road · ocean · road · road | Active |

TechNova case journey:
- **Consolidated**: Austin warehouse → road → Port of Houston → ocean (Maersk) → Mundra Port → customs + road → TechNova India Hub, Gurugram
- **Bengaluru order**: shares parent legs, then domestic air DEL→BLR + last-mile road delivery
- **Jaipur order**: shares parent legs, then surface road Gurugram → Jaipur

## What's Implemented
### Iteration 1 (2025-12)
- Sidebar workspace + hero search + revealed multimodal horizontal timeline + shipment list grid
- 4 mock shipments, status filters, sort, sample chips
- Shipment detail page reusing the timeline component

### Iteration 2 (2025-12)
- Shipper ↔ Customer view toggle on landing (URL param `?view=customer`)
- Audience-aware hero copy and example chips
- TechNova consolidated shipper shipment + 2 customer orders
- `LinkedOrdersPanel` on consolidated shipper view (deep links to each customer order)
- New `CustomerTimeline` — friendly vertical stepper with milestone labels
- New `/order/:orderNo` route + `CustomerOrderDetail` page
- Toaster moved to bottom-right to avoid overlap with ViewToggle

## Backlog (P0/P1/P2)
- **P1**: Per-card unique testid (e.g., `shipment-card-{id}`) — flagged in both test reports
- **P1**: Map view for ocean leg (vessel position) — Leaflet/Mapbox
- **P1**: Real carrier API integration (Maersk, Lufthansa) behind feature flag
- **P1**: Server-side default `audience='shipper'` if not specified, or `Literal` validation on the query param
- **P2**: Customer email/SMS alerts on milestone change
- **P2**: Sharable read-only timeline link (`/share/<token>`)
- **P2**: Bulk CSV upload, calendar view of ETAs
- **P2**: Dark mode + customer-view branding per shipper

## Testing Snapshot
- Iter 1: 10/10 backend pytest, 100% frontend
- Iter 2: 11/11 backend pytest, 100% frontend (15/15 review checks)
- No critical or minor backend issues; one minor UX polish (Toaster position) addressed
