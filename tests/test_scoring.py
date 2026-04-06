from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# ---------------------------
# BASELINE TEST
# ---------------------------
def test_anomaly_low_for_nominal():
    payload = {
        "asset_id": "TEST",
        "features": {"voltage": 690, "current": 100, "temp": 50},
    }
    resp = client.post("/score/anomaly", json=payload)
    data = resp.json()

    assert resp.status_code == 200
    assert data["score"] < data["threshold"]


# ---------------------------
# MONOTONICITY TEST
# ---------------------------
def test_anomaly_increases_with_temp():
    base = {"voltage": 690, "current": 100, "temp": 50}
    degraded = {"voltage": 690, "current": 100, "temp": 80}

    resp1 = client.post("/score/anomaly", json={"asset_id": "A", "features": base})
    resp2 = client.post("/score/anomaly", json={"asset_id": "A", "features": degraded})

    score1 = resp1.json()["score"]
    score2 = resp2.json()["score"]

    assert score2 > score1


# ---------------------------
# MULTI-FACTOR TEST
# ---------------------------
def test_anomaly_combined_effect():
    mild = {"voltage": 690, "current": 100, "temp": 60}
    severe = {"voltage": 720, "current": 130, "temp": 85}

    s1 = client.post("/score/anomaly", json={"asset_id": "A", "features": mild}).json()["score"]
    s2 = client.post("/score/anomaly", json={"asset_id": "A", "features": severe}).json()["score"]

    assert s2 > s1


# ---------------------------
# DETERMINISM TEST
# ---------------------------
def test_scoring_deterministic():
    payload = {
        "asset_id": "TEST",
        "features": {"voltage": 700, "current": 120, "temp": 70},
    }

    s1 = client.post("/score/anomaly", json=payload).json()["score"]
    s2 = client.post("/score/anomaly", json=payload).json()["score"]

    assert s1 == s2


# ---------------------------
# INVALID INPUT TEST
# ---------------------------
def test_invalid_input_rejected():
    payload = {
        "asset_id": "TEST",
        "features": {"voltage": None, "current": 100, "temp": 50},
    }

    resp = client.post("/score/anomaly", json=payload)
    assert resp.status_code in [400, 422]


# ---------------------------
# FAULT OUTPUT VALIDATION
# ---------------------------
def test_fault_output_structure():
    payload = {
        "asset_id": "TEST",
        "features": {"voltage": 710, "current": 130, "temp": 80},
    }

    resp = client.post("/score/fault", json=payload)
    data = resp.json()

    assert "probabilities" in data
    assert isinstance(data["probabilities"], dict)
    assert len(data["probabilities"]) > 0


# ---------------------------
# RUL BEHAVIOR TEST
# ---------------------------
def test_rul_decreases_with_stress():
    healthy = {"voltage": 690, "current": 100, "temp": 50}
    degraded = {"voltage": 720, "current": 130, "temp": 85}

    r1 = client.post("/score/rul", json={"asset_id": "A", "features": healthy}).json()["rul_hours"]
    r2 = client.post("/score/rul", json={"asset_id": "A", "features": degraded}).json()["rul_hours"]

    assert r2 < r1