# Smart Traffic Monitoring & Decision-Support System (prototype)

---
title: Smart Traffic Command Centre
emoji: 🚦
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---


An AI-powered traffic monitoring platform: it analyses traffic video (uploaded files, webcam or streams),
detects and tracks vehicles with YOLOv8, estimates density and congestion, raises alerts, and produces
**advisory-only** traffic-management recommendations on a smart-city style dashboard.

> **Advisory only.** The system is never connected to real traffic signals. Recommendations are suggestions;
> "Approve" just records a human officer's decision in the database.

## Status of this prototype (please read)

| Part | State |
|---|---|
| Backend (FastAPI + SQLite + WebSocket), AI pipeline, recommendation engine | Written; **26 unit tests pass**; pipeline + manager verified on a real video file and in demo mode |
| React dashboard (8 pages) | Written; JSX syntax-checked. **Not yet built or run in a browser** — it was authored in an environment with no npm network access. Run `npm install && npm run build` and tell me about any error — expect small fixes |
| FastAPI HTTP layer (`backend/api/routes.py`) | Compiles and is a thin wrapper over the tested services, but was **not exercised over HTTP** (FastAPI not installable where it was written) |
| YOLOv8 detector | Code written, **not run** (ultralytics/PyTorch not installable there). Tested path: OpenCV motion-fallback detector. First thing to verify on your machine |

## Quick start

Requirements: Python 3.10+, Node 18+.

```bash
# 1. Backend (from the project root)
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest -q tests                              # optional: 26 tests
python -m uvicorn backend.main:app --reload --port 8000

# 2. Frontend (second terminal)
cd frontend
npm install
npm run dev                                            # http://localhost:5173  (proxies /api and /ws to :8000)
```

Single-port alternative: `npm run build` in `frontend/`, then `./run.sh` (or just uvicorn) serves the dashboard at http://localhost:8000.
The SQLite database (`backend/database/traffic.db`) is created automatically on first start — no setup step.

## AI model setup

* YOLOv8 nano (`yolov8n.pt`, COCO-trained) is downloaded automatically on first use into `backend/models/weights/`.
  Offline? Download it from the Ultralytics releases page and place it in that folder.
* Use a bigger model (e.g. `yolov8s.pt`) or your own custom weights in **Settings → AI detection → YOLO weights file**.
* **Detector = auto**: tries YOLO, silently falls back to an OpenCV background-subtraction detector if ultralytics or the
  weights are missing (the UI and logs say which one is active). Choose `yolo` to make a missing model an explicit error.

## Testing with sample video

1. A synthetic clip is included (`uploads/sample_synthetic.mp4`; regenerate with `python scripts/make_sample_video.py`). It uses cartoon vehicles, so it
   exercises the **motion fallback** — YOLO is trained on real photos and will not reliably detect cartoons.
2. For the real YOLO test use any real top-down/elevated road footage (e.g. free clips from Pexels, or the UA-DETRAC / AI City datasets).
3. Command-line check without the web app: `python -m backend.ai.cli uploads/sample_synthetic.mp4 --out /tmp/annotated.mp4`

## Demo workflow (for a presentation)

1. **Settings → Demo mode** on → dashboard fills with clearly-labelled **SAMPLE** data: 5 junctions, 14 days of history, and a live 5-minute traffic
   cycle that triggers alerts and recommendations. A yellow banner shows on every page.
2. Turn demo mode off → **Live Monitoring** → upload a video → watch bounding boxes, counts, density and congestion update live.
3. **Camera Management → Set ROI** to outline the road area (improves density accuracy).
4. **Traffic Analytics**: peak hours, period comparison. **AI Recommendations**: approve/dismiss. **Reports**: CSV download.
5. Real data and demo data are stored separately (`is_demo` flag) and are never mixed.

## How the AI works

1. **Detection** – YOLOv8 finds car / motorcycle / bicycle / bus / truck boxes in each analysed frame (default 8 fps, frames downscaled to ≤960 px).
2. **Tracking** – own multi-object tracker (IoU + centre distance, Hungarian assignment, velocity prediction) gives each vehicle a persistent ID. A vehicle is
   **counted once** when its track is confirmed, so it is not double-counted across frames.
3. **Density** – `score = 0.6 × occupancy% (box area ∩ ROI) + 0.4 × (vehicles in ROI ÷ capacity)`. LOW/MODERATE/HIGH/SEVERE thresholds (default 20/40/60) are editable.
4. **Congestion** – `index = 0.5 × density + 0.3 × slowness + 0.2 × stationary%`; alert when CONGESTED persists for a configurable duration, on SEVERE density, or when many vehicles are stationary.
5. **Recommendations** – transparent rule-based engine (no black box): signal-timing advice by level, nearby-junction monitoring when a junction is heavily congested
   (uses camera GPS distance), emergency flag → CRITICAL priority review, incident/blockage check. Each shows condition, reason, action, priority, timestamp; with cooldowns to avoid spam.

## Limitations (be upfront about these in your presentation)

* Density/speed come from image pixels with no camera calibration: **estimates**, comparable over time on one camera, not absolute measures. Speed in km/h is a rough approximation.
* Counting is "unique tracked vehicles", not a line-crossing counter; ID switches in heavy occlusion can over/under-count.
* Emergency-vehicle detection is an **experimental flashing red/blue light heuristic** (COCO has no ambulance class) plus a manual operator flag.
* Map corridors are straight lines between nearby junctions, not real road geometry. Demo junction coordinates (Chennai) are approximate samples.
* "Recommendations" are rules, not a learned model; they are not validated against real signal-timing plans.
* No user authentication; intended for local/prototype use. Webcam must be attached to the machine running the backend.

## Project layout

```
backend/
  main.py            FastAPI app + WebSocket          api/routes.py   REST endpoints (thin)
  ai/                detector, tracker, density, congestion, emergency, pipeline, cli   (no web code)
  services/          stream_manager, recommendation_engine, demo_service, event_hub
  database/          schema.sql, db.py (SQLite)       models/         request schemas, weights/
frontend/            React + Tailwind + Recharts + Leaflet (src/pages, components, context, lib)
uploads/  tests/  scripts/
```

API docs are generated automatically at http://localhost:8000/docs.
