from typing import Dict

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

BATCH_STORE: Dict[str, list] = {}
STREAM_LAST: Dict[str, dict] = {}


def ingest_batch(req: BatchIngestRequest) -> int:
    BATCH_STORE.setdefault(req.asset_id, []).extend(req.rows)
    return len(req.rows)


def ingest_stream(req: StreamIngestRequest) -> None:
    STREAM_LAST[req.asset_id] = {
        "timestamp": req.timestamp.isoformat(),
        "values": req.values,
    }


def _normalize(features: Dict[str, float]) -> Dict[str, float]:
    if not features:
        return {}
    values = list(features.values())
    mn = min(values)
    mx = max(values)
    if mn == mx:
        return {name: 0.5 for name in features}
    return {name: (val - mn) / (mx - mn) for name, val in features.items()}


def score_anomaly(req: AnomalyScoreRequest) -> AnomalyScoreResponse:
    values = list(req.features.values())
    mean = sum(values) / len(values)
    var = sum((v - mean) ** 2 for v in values) / len(values)
    score = float(var)
    threshold = 0.05
    factors = _normalize(req.features)
    return AnomalyScoreResponse(score=score, threshold=threshold, top_factors=factors)


def score_fault(req: FaultScoreRequest) -> FaultScoreResponse:
    norm = _normalize(req.features)
    buckets: Dict[str, float] = {
        "electrical_fault": 0.0,
        "mechanical_fault": 0.0,
        "thermal_fault": 0.0,
        "normal": 0.0,
    }

    for name, value in norm.items():
        key = name.lower()
        if "volt" in key or "current" in key:
            buckets["electrical_fault"] += value
        elif "vib" in key or "speed" in key:
            buckets["mechanical_fault"] += value
        elif "temp" in key or "thermal" in key:
            buckets["thermal_fault"] += value
        else:
            buckets["normal"] += value

    total = sum(buckets.values()) or 1.0
    probabilities = {k: buckets[k] / total for k in buckets}

    return FaultScoreResponse(probabilities=probabilities, top_factors=norm)


def score_rul(req: RULScoreRequest) -> RULScoreResponse:
    norm = _normalize(req.features)
    if not norm:
        base = 1000.0
    else:
        avg = sum(norm.values()) / len(norm)
        base = max(10.0, (1.0 - avg) * 1000.0)

    ci = [base * 0.8, base * 1.2]

    return RULScoreResponse(rul_hours=base, confidence_interval=ci)
