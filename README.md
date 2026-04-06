This project implements a small backend service and a simple web interface
for a predictive maintenance scenario for high-voltage renewable assets.

The backend is written in Python using FastAPI and exposes endpoints for:

- Health check
- Batch data ingestion
- Streaming data ingestion
- Anomaly scoring
- Fault scoring
- Remaining useful life (RUL) estimation

The frontend is a basic single-page application that can call these endpoints
and display responses.

## Project Structure

- app/
  - main.py        FastAPI application and routes
  - schemas.py     Request and response models
  - services.py    Core logic and in-memory storage
- frontend/
  - index.html     Web page
  - app.js         Frontend logic
  - styles.css     Basic styling
- tests/
  - test_health.py Basic API health tests
  - test_scoring.py Sample scoring tests
- requirements.txt Python dependencies
- Dockerfile       Container build file

## Running with Python

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then open a browser at:

http://127.0.0.1:8000/
```

## Running with Docker

```bash
docker build -t pdm-system .
docker run -p 8000:8000 pdm-system
```

The frontend will be available on the same port.
