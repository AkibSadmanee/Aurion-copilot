from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.stream import router as stream_router

app = FastAPI()

# Allow React to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the WebSocket router from stream.py
app.include_router(stream_router)

# Run with: uvicorn app.main:app --reload