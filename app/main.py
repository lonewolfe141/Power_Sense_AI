from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .schemas import (
    BatchIngestRequest,
    StreamIngestRequest,
    AnomalyScoreRequest,
    FaultScoreRequest,
    RULScoreRequest,
    AnomalyScoreResponse,
    FaultScoreResponse,
    RULScoreResponse,
)
from .services import (
    ingest_batch,
    ingest_stream,
    score_anomaly,
    score_fault,
    score_rul,
)

app = FastAPI(title="Power Sense AI: An AI Powered Predictive Maintenance for High Voltage Renewable Power Systems", version="1.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/ingest/batch")
def ingest_batch_endpoint(req: BatchIngestRequest):
    if not req.rows:
        raise HTTPException(status_code=400, detail="rows cannot be empty")
    count = ingest_batch(req)
    return {"rows_ingested": count}


@app.post("/ingest/stream")
def ingest_stream_endpoint(req: StreamIngestRequest):
    ingest_stream(req)
    return {"status": "accepted"}


@app.post("/score/anomaly", response_model=AnomalyScoreResponse)
def score_anomaly_endpoint(req: AnomalyScoreRequest):
    if not req.features:
        raise HTTPException(status_code=400, detail="features cannot be empty")
    return score_anomaly(req)


@app.post("/score/fault", response_model=FaultScoreResponse)
def score_fault_endpoint(req: FaultScoreRequest):
    if not req.features:
        raise HTTPException(status_code=400, detail="features cannot be empty")
    return score_fault(req)


@app.post("/score/rul", response_model=RULScoreResponse)
def score_rul_endpoint(req: RULScoreRequest):
    if not req.features:
        raise HTTPException(status_code=400, detail="features cannot be empty")
    return score_rul(req)


# Serve static frontend
frontend_path = Path(__file__).resolve().parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_path), html=True), name="frontend")
