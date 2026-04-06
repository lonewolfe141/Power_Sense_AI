from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel


class BatchIngestRequest(BaseModel):
    asset_id: str
    rows: List[Dict[str, float]]


class StreamIngestRequest(BaseModel):
    asset_id: str
    timestamp: datetime
    values: Dict[str, float]


class AnomalyScoreRequest(BaseModel):
    asset_id: str
    features: Dict[str, float]


class FaultScoreRequest(BaseModel):
    asset_id: str
    features: Dict[str, float]


class RULScoreRequest(BaseModel):
    asset_id: str
    features: Dict[str, float]


class AnomalyScoreResponse(BaseModel):
    score: float
    threshold: float
    top_factors: Dict[str, float]


class FaultScoreResponse(BaseModel):
    probabilities: Dict[str, float]
    top_factors: Dict[str, float]


class RULScoreResponse(BaseModel):
    rul_hours: float
    confidence_interval: Optional[List[float]] = None
