# Voice Recorder API - Backend

FastAPI backend for the Voice Recorder application.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application entry point
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py      # Configuration settings
│   ├── routes/
│   │   ├── __init__.py
│   │   └── health.py        # Health check routes
│   ├── models/
│   │   └── __init__.py      # Data models (Pydantic)
│   └── services/
│       └── __init__.py      # Business logic
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Setup

### Prerequisites
- Python 3.8+
- Conda environment named `chw` (or any Python environment)

### Installation

1. Activate your conda environment:
```bash
conda activate chw
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create environment file:
```bash
cp .env.example .env
```

## Running the Server

### Development Mode (with auto-reload)

```bash
# From the backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Available Endpoints

- `GET /` - Root endpoint with API info
- `GET /health` - Health check endpoint

## Development

### Adding New Routes

1. Create a new file in `app/routes/`
2. Define your router using FastAPI's `APIRouter`
3. Import and include the router in `app/main.py`

Example:
```python
# app/routes/example.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/example")
async def example_endpoint():
    return {"message": "Example"}

# app/main.py
from app.routes import example
app.include_router(example.router, tags=["Example"])
```

### Adding Services

Place business logic in `app/services/` to keep routes clean and testable.

### Adding Models

Define Pydantic models in `app/models/` for request/response validation.

## Configuration

Settings are managed in `app/config/settings.py` using Pydantic Settings.
Override values using environment variables or a `.env` file.
