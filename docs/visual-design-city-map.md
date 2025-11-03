# Visual Design & Implementation Notes — City Map, Neighborhoods, Lots

Last updated: 2025-11-03  
Author: Jesivis

--- 

## Purpose
Capture the high-level design, tech options and immediate next steps for the "city map" visual system so the team can pick this up later without losing context.

This document contains:
- Short descriptions of recommended approaches
- Data/asset formats and minimal API surface
- A minimal viable prototype plan and timeline
- A short checklist for next actions

---

## Quick summary (one-sentence)
Build a browser-based interactive city map (start with a 2D GeoJSON-driven prototype) that renders neighborhoods and lots, supports pan/zoom, lot hover + click details, and has simple server endpoints to serve GeoJSON.

---

## Recommended location in repo
Place this file under `docs/visual-design-city-map.md` (create a `docs/` folder if it doesn't exist). Rationale:
- `docs/` is versioned with the repo and visible to contributors.
- Easy to evolve into a longer spec, link from README, or convert into a wiki page later.

Alternative: repository Wiki (good for discussion), or a top-level `NOTES/` folder if you prefer. I recommend `docs/` for discoverability.

---

## Tech choices (pick one)
- Option A — 2D interactive web map (Recommended, fastest)
  - Frontend: Mapbox GL JS (if you want styling power) or Leaflet (fully open-source)
  - Backend: Node/Express endpoints that return GeoJSON (we already have a Node server stub)
  - Data: GeoJSON FeatureCollections (neighborhoods, lots)
- Option B — 2.5D stylized map
  - Frontend: PixiJS (canvas) or a React + canvas library
  - Adds custom art / tiles for a game-like view
- Option C — Full 3D immersion
  - Frontend: Three.js or game engine (Unity)
  - Requires 3D assets and more time

---

## Data model (minimal)
- Neighborhood (GeoJSON Feature):
  - type: Feature
  - geometry: Polygon
  - properties:
    - id (string)
    - name (string)
    - category (string) — e.g., residential, commercial
    - color (optional)
- Lot (GeoJSON Feature):
  - type: Feature
  - geometry: Polygon or Rectangle
  - properties:
    - id (string)
    - status (available/claimed)
    - owner (string|null)
    - price (optional)
    - metadata (free-form)

Example (server will return GeoJSON):
```json
{
  "type":"FeatureCollection",
  "features":[
    { "type":"Feature","geometry":{/* polygon */},"properties":{"id":"n-1","name":"Downtown"}} 
  ]
}
```

---

## Minimal API endpoints (server)
Prototyping endpoints to add to the Node server:
```
GET /api/neighborhoods            -> GeoJSON FeatureCollection (neighborhoods)
GET /api/lots?neighborhoodId=ID  -> GeoJSON FeatureCollection (lots in neighborhood)
GET /api/lot/:id                 -> JSON metadata for a single lot
POST /api/lot/:id/claim          -> (future) claim a lot — returns 200/409
```

---

## Minimal viable prototype (MVP) — what to deliver first
1. Seed data:
   - `data/neighborhoods.geojson`
   - `data/lots.geojson` (small sample set)
2. Frontend demo page:
   - `web/map-demo.html` or `frontend/` React app
   - Loads GeoJSON and renders neighborhoods and lots
   - Supports: pan/zoom, hover highlight, click -> show lot panel
3. Backend endpoints (Node):
   - Serve static GeoJSON under `/api/*` to keep things simple for prototype
4. One smoke test:
   - Load page and click a lot — metadata panel appears

Estimated time to prototype: ~1–3 days depending on polish.

---

## Styling & UX details (quick)
- Colors: choose a palette for neighborhood categories + lot states
- Hover state: thin bright outline + semi-transparent fill
- Selected state: bold outline + details panel
- Legend and filters: toggle available / claimed lots
- Mobile: ensure pinch-zoom and tap handling

---

## Files & folder structure (suggested)
- docs/visual-design-city-map.md  ← this note
- data/neighborhoods.geojson
- data/lots.geojson
- server/ (existing)
  - server/routes/api.js  ← add endpoints to return GeoJSON
- frontend/
  - index.html
  - app.js
  - styles.css

---

## Checklist (what to do next)
- [ ] Add this note to `docs/visual-design-city-map.md` in the repo
- [ ] Seed small GeoJSON files under `data/`
- [ ] Add simple Node endpoints to serve GeoJSON
- [ ] Create a minimal front-end demo (Mapbox/Leaflet)
- [ ] Run one CI smoke test to confirm server returns GeoJSON and demo loads

---

## Good-to-have but optional later
- Postgres + PostGIS for spatial queries (for scale)
- Vector tiles for very large maps
- Authentication for claiming lots
- Map styling via Mapbox Studio (if you use Mapbox)

---

## Immediate next action (pick one and record it in the issue or TODO)
- Option A (fast): I’ll produce a tiny demo using Leaflet + static GeoJSON. (If you pick this now, say: “Make prototype (Leaflet)”)
- Option B (mockup): I’ll generate a static mockup image showing neighborhoods and a lot inspector. (Say: “Make mockup”)
- Option C (data): You’ll provide a small GeoJSON sample and I’ll plug it into the demo. (Say: “I’ll provide GeoJSON”)

---

## Notes & contact
- Keep this file under `docs/` and link from the main README with a short pointer:  
  `See docs/visual-design-city-map.md for the visual plan and next steps.`
- If you want, I can open a PR with the initial `data/` seed and a prototype scaffold — say the word and I’ll prepare the files.
