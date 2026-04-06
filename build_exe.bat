@echo off
echo === Building Power Sense AI EXE ===

REM Activate your virtual environment (adjust path if needed)
call .venv\Scripts\activate

REM Install PyInstaller if not already installed
pip install pyinstaller

REM Build single-file EXE
pyinstaller --noconfirm --onefile --name PowerSenseAI start_app.py

echo.
echo Build finished.
echo EXE is located at: dist\PowerSenseAI.exe
echo.
pause
