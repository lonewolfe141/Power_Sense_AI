import subprocess
import sys
import webbrowser
import time
import os

REQUIRED_PACKAGES = ["fastapi", "uvicorn", "pydantic", "httpx"]


def install_missing_packages():
    for pkg in REQUIRED_PACKAGES:
        try:
            __import__(pkg)
        except ImportError:
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])


def launch_server():
    print("[System] Starting Predictive Maintenance Server...")
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return process


def open_browser():
    print("[System] Opening dashboard UI...")
    time.sleep(2)
    webbrowser.open("http://127.0.0.1:8000/")


def main():
    print("=== Predictive Maintenance System Launcher ===")

    install_missing_packages()

    process = launch_server()

    open_browser()

    print("[System] Running. Close this window to stop the software.")

    try:
        process.wait()
    except KeyboardInterrupt:
        print("[System] Shutting down...")
        process.terminate()


if __name__ == "__main__":
    main()
