from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint

    Returns:
        dict: Server health status
    """
    return {
        "status": "healthy",
        "message": "Voice Recorder API is running"
    }
