from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_status_ok():
    resp = client.get("/health")
    assert resp.status_code == 200

    data = resp.json()
    assert "status" in data
    assert data["status"] == "ok"


def test_health_response_schema():
    resp = client.get("/health")
    data = resp.json()

    # Ensure no missing critical keys
    assert isinstance(data, dict)
    assert "status" in data


def test_health_response_time():
    import time
    start = time.time()
    resp = client.get("/health")
    duration = time.time() - start

    assert resp.status_code == 200
    assert duration < 0.5  # must be fast