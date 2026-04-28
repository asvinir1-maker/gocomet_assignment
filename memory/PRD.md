# UniRoute — Unified Multimodal Logistics Tracker

## Original Problem Statement
> Create a logistics view landing page similar to GoTrack but with a unified view for a shipment ID when punched in, so the whole journey involving applicable air, ocean and road modes are visible.

## User Choices (collected via ask_human)
- Data source: Mock/demo data
- Visual style: Clean enterprise SaaS (design agent → Swiss / High-Contrast archetype)
- Page composition: Both — landing search + sample shipment list
- Sample shipment IDs pre-loaded with realistic multimodal journeys

## Architecture
- **Backend** (FastAPI): in-memory mock list `SHIPMENTS` with 4 shipments. Endpoints:
  - `GET /api/shipments?status=...` (status filter optional)
  - `GET /api/shipments/{id_or_reference}` (case-insensitive, supports ID or PO reference)
- **Frontend** (React 19 + Tailwind + shadcn primitives + sonner + lucide-react):
  - `/` Landing — Sidebar + Hero search + revealed Multimodal Timeline + Shipment list grid
  - `/shipment/:id` — Detail page with the same unified timeline
  - Components: `Sidebar`, `HeroSearch`, `MultimodalTimeline`, `ShipmentCard`, `StatusBadge`, `ModeIcon`
  - Typography: Cabinet Grotesk (display) + IBM Plex Sans (body) + JetBrains Mono (data)

## Mock Shipments
| ID | Route | Modes | Status |
|---|---|---|---|
| SHP-2025-1042 | Shenzhen → Los Angeles | road · ocean · road | Active |
| SHP-2025-2081 | Munich → Newark | road · air · road | Completed |
| SHP-2025-3155 | Mumbai → Chicago | road · ocean · air · road | Active |
| SHP-2025-4209 | Singapore → Sydney | ocean · road | Delayed |

## What's Implemented (2025-12)
- Hero search w/ giant mono input + example chips + stats grid + SVG coordinate grid bg
- Unified horizontal multimodal timeline (mode-coloured: road=emerald, ocean=blue, air=sky), per-leg cards with carrier, vehicle/vessel/flight, from/to, ETD/ETA, status pill, notes
- Origin / ETA / Destination summary strip with country flags
- Shipment list grid with status filter chips + AZ/ZA sort + mode chips + progress bars
- Shipment detail page reusing the timeline component
- Sidebar nav with status quick-filters and counters
- Toast errors for invalid IDs (sonner)
- Responsive layout, fade-up + leg-pulse micro-animations, focus rings

## Backlog (P0/P1/P2)
- **P1**: Per-card unique `data-testid` (e.g., `shipment-card-{id}`) for deeper test addressability
- **P1**: Map view for ocean leg (vessel position) — Leaflet/Mapbox
- **P1**: Real carrier API integration behind a feature flag (Maersk, Lufthansa, etc.)
- **P2**: Persist tracked shipments to MongoDB watchlist + email/Slack alerts on status change
- **P2**: Bulk upload / CSV import flow
- **P2**: Sharable read-only timeline link (e.g., `/share/<token>`)
- **P2**: Calendar view showing ETAs across the workspace
- **P2**: Dark mode variant

## Testing Snapshot
- Backend pytest: 10/10 pass (`/app/backend/tests/test_shipments.py`)
- Frontend e2e (Playwright via testing agent): 100% pass — search, timeline reveal, filters, navigation, error toasts, status badges all verified
- No mocked external integrations beyond intentional shipment mock data

## Tech Notes
- No external APIs / keys; safe to deploy as-is
- Backend on supervisor (port 8001); frontend on supervisor (port 3000) with hot reload
- All routes under `/api`; frontend uses `REACT_APP_BACKEND_URL`
