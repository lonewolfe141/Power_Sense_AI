import threading
import time
import webbrowser

import uvicorn


def run_server():
    """
    Start the FastAPI server using uvicorn.
    Assumes your ASGI app is defined in app/main.py as 'app'.
    """
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)


def main():
    # Start backend server in a background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Give the server a moment to start
    time.sleep(2)

    # Open the dashboard in the default browser
    webbrowser.open("http://127.0.0.1:8000/")

    print("Power Sense AI is running on http://127.0.0.1:8000/")
    print("Leave this window open while you use the dashboard.")
    print("Press Ctrl+C here to exit.")

    try:
        # Keep the process alive until user closes it
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down Power Sense AI...")


if __name__ == "__main__":
    main()
