# Power Sense AI

## Project Overview

**Power Sense AI** is a FastAPI-based predictive maintenance prototype for **high-voltage renewable power systems**. It combines a lightweight Python backend with a browser-based dashboard to ingest telemetry, score anomalies, classify broad fault categories, estimate remaining useful life (RUL), and preserve scan history for operator review. The core concept, as described in the project documentation, is a unified workflow for telemetry-driven condition monitoring using voltage, current, temperature, and vibration inputs.

The prototype is organized as a small full-stack engineering demo rather than a production platform. The backend exposes API endpoints for health checking, ingestion, anomaly scoring, fault scoring, and RUL estimation, while the frontend provides operator panels for manual input, visualization, history tracking, and asset management. The README explicitly describes this structure as a “small backend service and a simple web interface” for predictive maintenance of high-voltage renewable assets.

---

## Core Capabilities

The current project provides the following main capabilities:

- **Health check endpoint** to verify backend availability.
- **Batch ingestion** for loading multiple telemetry rows for an asset.
- **Streaming ingestion** for point-wise live-style data ingestion.
- **Anomaly scoring** based on the dispersion of current feature values.
- **Fault scoring** using broad heuristic buckets for electrical, mechanical, thermal, and normal conditions.
- **RUL estimation** using a normalized degradation-style heuristic.
- **Single-page dashboard UI** for interactive testing and demonstration.
- **Asset manager** for adding and switching between asset identifiers.
- **History table** to preserve scan outcomes during runtime.
- **Result export** to JSON for anomaly, fault, and RUL outputs.

---

## Project Structure

The repository is logically organized as follows:

```text
app/
  main.py          # FastAPI application and route definitions
  schemas.py       # Pydantic request/response models
  services.py      # Core scoring logic and in-memory storage
frontend/
  index.html       # Frontend layout
  app.js           # Frontend behavior and live simulation logic
  styles.css       # Dashboard styling
tests/
  test_health.py   # Health endpoint tests
  test_scoring.py  # Scoring behavior tests
README.md
requirements.txt
start.py
start_app.py
Dockerfile
build_exe.bat
PowerSenseAI.spec
```

This layout is reflected in the README and in the import structure used by the backend code.

---

## Backend Architecture

### 1. `app/main.py`

The backend entry point defines a FastAPI application titled:

> **Power Sense AI: An AI Powered Predictive Maintenance for High Voltage Renewable Power Systems**

It enables permissive CORS and exposes the following routes:

- `GET /health`
- `POST /ingest/batch`
- `POST /ingest/stream`
- `POST /score/anomaly`
- `POST /score/fault`
- `POST /score/rul`

The backend also mounts the frontend as static files when a `frontend` directory exists, allowing the UI to be served from the same FastAPI process.

### 2. `app/schemas.py`

The schema layer defines the project’s input and output contracts using Pydantic models.

#### Request models
- `BatchIngestRequest`
- `StreamIngestRequest`
- `AnomalyScoreRequest`
- `FaultScoreRequest`
- `RULScoreRequest`

#### Response models
- `AnomalyScoreResponse`
- `FaultScoreResponse`
- `RULScoreResponse`

These models enforce the project’s basic API contract and structure JSON payloads for frontend-to-backend communication.

### 3. `app/services.py`

This file contains the current working logic of the application.

#### Storage
The project presently uses **in-memory stores**:
- `BATCH_STORE`
- `STREAM_LAST`

There is no database integration in the current baseline.

#### Ingestion
- `ingest_batch(req)` appends rows to the in-memory store for a given asset.
- `ingest_stream(req)` stores the most recent stream packet per asset.

#### Scoring logic
The current scoring layer is a **placeholder heuristic implementation**, not a field-validated predictive maintenance model.

- **Anomaly scoring** computes variance across the input feature values and compares it against a fixed threshold.
- **Fault scoring** normalizes features and allocates them into coarse buckets based on key names such as `volt`, `current`, `temp`, and `vib`.
- **RUL scoring** normalizes features, computes an average stress signal, and derives a simple RUL estimate with a confidence interval.

This is appropriate for a prototype, but it is not yet a physically calibrated reliability model.

---

## Frontend Architecture

### 1. `frontend/index.html`

The frontend is a single-page dashboard with these main sections:

- **Dashboard**
- **Anomaly Detection**
- **Fault Classification**
- **RUL Estimation**
- **Scan History**
- **Asset Manager**

The HTML uses a sidebar for navigation, a topbar for the title, and panel-based sections for each workflow. The page also loads **Chart.js** from a CDN and then loads `app.js`.

### 2. `frontend/styles.css`

The CSS defines a dark operator-style UI with:

- fixed left sidebar
- dark background panels
- cyan-accent buttons and branding
- basic table formatting
- form field styling for manual telemetry entry

This is a simple, functional dashboard stylesheet rather than a design system.

### 3. `frontend/app.js`

The frontend JavaScript handles:

- panel switching
- asset list initialization and update
- preset value population for known assets
- scan ID generation
- feature extraction from input fields
- API POST calls
- anomaly, fault, and RUL result rendering
- JSON export
- history table updates
- live sensor simulation and chart updates

The baseline uploaded `app.js` already contains a more advanced simulation section than the original random-jitter version discussed earlier in chat. It includes asset-specific profiles and state-based updates, but it still remains a **frontend simulator** rather than a production-grade digital twin.

---

## Supported Assets in the Baseline

The current uploaded baseline includes the following built-in assets:

- `WIND_TURBINE_01`
- `WIND_TURBINE_02`
- `SOLAR_INVERTER_01`
- `SOLAR_INVERTER_02`
- `BATTERY_PACK_01`
- `TRANSFORMER_HV_01`

Each preset includes nominal values for:

- voltage
- current
- temperature
- vibration

These presets are used by the frontend to prefill manual scoring forms.

---

## API Endpoints

### `GET /health`
Returns:

```json
{ "status": "ok" }
```

### `POST /ingest/batch`
Accepts:

```json
{
  "asset_id": "WIND_TURBINE_01",
  "rows": [
    {"voltage": 690, "current": 120, "temp": 65, "vib": 0.32}
  ]
}
```

Returns the number of ingested rows.

### `POST /ingest/stream`
Accepts:

```json
{
  "asset_id": "WIND_TURBINE_01",
  "timestamp": "2026-04-17T20:00:00",
  "values": {
    "voltage": 690,
    "current": 120,
    "temp": 65,
    "vib": 0.32
  }
}
```

Returns an accepted status.

### `POST /score/anomaly`
Accepts telemetry features and returns:

- `score`
- `threshold`
- `top_factors`

### `POST /score/fault`
Accepts telemetry features and returns:

- `probabilities`
- `top_factors`

### `POST /score/rul`
Accepts telemetry features and returns:

- `rul_hours`
- `confidence_interval`

---

## Testing

The project includes two test files.

### `tests/test_health.py`
Covers:
- `/health` response code
- schema shape of the health response
- basic response-time expectation

### `tests/test_scoring.py`
Covers:
- anomaly score behavior under nominal inputs
- monotonic increase of anomaly with worsening temperature
- stronger anomaly response under multi-factor stress
- deterministic scoring behavior
- invalid input rejection
- fault response structure
- RUL decreasing under degraded operating conditions

These tests are good for baseline regression checks, though they still validate heuristic behavior rather than field-calibrated model fidelity.

---

## Launch and Utility Files

### `requirements.txt`
The uploaded dependency file lists:

- `fastapi`
- `uvicorn`
- `pydantic`
- `httpx`
- `pytest`

### `start.py`
This launcher:
- checks and installs required packages
- starts the backend using `uvicorn app.main:app --reload`
- opens the browser automatically

### `start_app.py`
This launcher:
- starts Uvicorn from Python in a background thread
- waits briefly
- opens the UI in the browser
- keeps the process alive until interrupted

### Packaging files
The project also includes:
- `Dockerfile`
- `build_exe.bat`
- `PowerSenseAI.spec`

These indicate intent for containerization and Windows executable packaging.

---

## Current Engineering Assessment

### What is solid
- Clean small-project separation between backend, frontend, and tests
- Functional FastAPI routing layer
- Typed request/response contracts
- Deterministic scoring behavior
- Simple browser-based operator workflow
- JSON export and scan history support
- Easy local startup path

### What is still prototype-grade
- In-memory storage only; no persistence layer
- No authentication or access control
- No real telemetry broker, message queue, or time-series database
- No model versioning or artifact management
- No true ML model loading pipeline
- No domain-calibrated physics or failure-progression logic in the backend scoring service
- No uncertainty-aware prognostics beyond a simple interval heuristic
- Frontend simulation is still synthetic and not a full field-grade asset model

### Bottom line
This is a **good engineering prototype / academic demonstration system**. It is not yet a production predictive maintenance platform.

---

## GitHub-Ready Run Instructions

Below is a clean section you can place directly into a GitHub `README.md`.

---

# Run the Project

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/power-sense-ai.git
cd power-sense-ai
```

## 2. Create and activate a virtual environment

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

## 4. Start the application

### Recommended FastAPI command

```bash
uvicorn app.main:app --reload
```

After startup, open:

```text
http://127.0.0.1:8000/
```

## 5. Alternative launcher options

### Launcher script 1

```bash
python start.py
```

### Launcher script 2

```bash
python start_app.py
```

Both launchers are intended to start the server and open the dashboard automatically.

## 6. Run tests

```bash
pytest -v
```

---

## Recommended GitHub Repository Layout

```text
power-sense-ai/
├── app/
│   ├── main.py
│   ├── schemas.py
│   └── services.py
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── tests/
│   ├── test_health.py
│   └── test_scoring.py
├── README.md
├── requirements.txt
├── start.py
├── start_app.py
├── Dockerfile
├── build_exe.bat
└── PowerSenseAI.spec
```

---

## Recommended `.gitignore`

```gitignore
__pycache__/
*.pyc
.venv/
.env
.pytest_cache/
.dist/
build/
*.spec.bak
*.log
.vscode/
.idea/
.DS_Store
```

---

## Recommended First GitHub Commit

```bash
git init
git add .
git commit -m "Initial commit: Power Sense AI predictive maintenance dashboard"
```

If creating a new remote repository:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/power-sense-ai.git
git push -u origin main
```

---

## Suggested Future GitHub README Sections

For a stronger public repository, add these sections next:

1. **Architecture diagram**
2. **API request/response examples**
3. **Screenshots of dashboard panels**
4. **Known limitations**
5. **Roadmap**
6. **Deployment instructions**
7. **License**

---

## Note on the Enhanced Simulation File

A separate enhanced frontend simulation file was generated during this work:

- `app_ultra_realistic.js`

That file was created as a **new artifact** and was **not used to overwrite the uploaded baseline**. If you decide to adopt it later, it should be reviewed and integrated deliberately rather than assumed to be the active repository file.

---

## Source Basis for This Summary

This markdown is based on the uploaded backend, frontend, tests, launcher scripts, dependency file, and project README supplied in the conversation.
