# models/user_model.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Dict, List

class User(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    profilepic: Optional[str] = None
    bio: Optional[str] = None
    liked_Songs: List[str] = Field(default_factory=list)
    mood_search_count: int = 0
    Mood_History: Dict[str, int] = {
        "angry": 0,
        "disgust": 0,
        "fear": 0,
        "happy": 0,
        "neutral": 0,
        "sad": 0,
        "surprise": 0
    }
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
