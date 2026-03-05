# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start Flask server
python backend/app.py


# Navigate to frontend directory
cd frontend

# Start simple HTTP server
python -m http.server 8000

http://localhost:8000/index.html