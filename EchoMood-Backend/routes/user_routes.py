# routes/user_routes.py
from fastapi import APIRouter, HTTPException, status
from models.user_model import User
from db import users_collection
from bson import ObjectId
from datetime import datetime
import re, bcrypt
from pydantic import BaseModel

router = APIRouter()

# ✅ Helper: convert ObjectId → string
def user_helper(user) -> dict:
    return {
        "user_id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "date_of_birth": user.get("date_of_birth"),
        "gender": user.get("gender"),
        "country": user.get("country"),
        "profilepic": user.get("profilepic"),
        "bio": user.get("bio"),
        "liked_Songs": [str(x) for x in user.get("liked_Songs", [])],
        "mood_search_count": user.get("mood_search_count", 0),
        "Mood_History": user.get("Mood_History", {}),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at")
    }

# ✅ Password Strength Validator
def is_strong_password(password: str) -> bool:
    """Checks if password has 8+ chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char."""
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[@$!%*?&#]", password):
        return False
    return True


# ✅ 1. Register User
@router.post("/register")
async def register_user(user: User):
    if await users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists ❌")
    if await users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists ❌")

    if not is_strong_password(user.password):
        raise HTTPException(
            status_code=400,
            detail="Weak password ❌ | Must contain 8+ chars, uppercase, lowercase, number & special char."
        )

    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    user_dict = user.dict()
    user_dict["password"] = hashed_pw.decode('utf-8')
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    # Ensure optional fields exist
    user_dict.setdefault("bio", None)
    user_dict.setdefault("liked_Songs", [])
    user_dict["Mood_History"] = {
        "angry": 0, "disgust": 0, "fear": 0, "happy": 0,
        "neutral": 0, "sad": 0, "surprise": 0
    }

    result = await users_collection.insert_one(user_dict)
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    return {"message": "User registered successfully ✅", "user": user_helper(created_user)}


# ✅ 2. Login (JSON Body)
class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login_user(data: LoginRequest):
    user = await users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found ❌")

    if not bcrypt.checkpw(data.password.encode('utf-8'), user["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid password ❌")

    return {"message": "Login successful ✅", "user": user_helper(user)}


# ✅ 3. Get user by user_id
@router.get("/{user_id}")
async def get_user_by_id(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID ❌")

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found ❌")

    return {"user": user_helper(user)}


# ✅ 4. Update user profile
@router.put("/update/{user_id}")
async def update_user(user_id: str, updated_data: dict):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID ❌")

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found ❌")

    # Validate types for new fields
    if "liked_Songs" in updated_data:
        ls = updated_data["liked_Songs"]
        if not isinstance(ls, list):
            raise HTTPException(status_code=400, detail="liked_Songs must be a list ❌")
        converted_ls = []
        for s in ls:
            if isinstance(s, ObjectId):
                converted_ls.append(s)
            elif isinstance(s, str) and ObjectId.is_valid(s):
                converted_ls.append(ObjectId(s))
            else:
                raise HTTPException(status_code=400, detail="Each liked_Songs item must be a valid song ObjectId ❌")
        updated_data["liked_Songs"] = converted_ls
    if "bio" in updated_data and updated_data["bio"] is not None and not isinstance(updated_data["bio"], str):
        raise HTTPException(status_code=400, detail="bio must be a string ❌")

    updated_data["updated_at"] = datetime.utcnow()
    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": updated_data})

    new_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    return {"message": "User profile updated successfully ✅", "user": user_helper(new_user)}


# ✅ 5. Update Mood_History + mood_search_count
class MoodUpdate(BaseModel):
    mood: str

@router.put("/update_mood/{user_id}")
async def update_mood_history(user_id: str, data: MoodUpdate):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID ❌")

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found ❌")

    mood_history = user.get("Mood_History", {})
    if data.mood not in mood_history:
        raise HTTPException(status_code=400, detail="Invalid mood ❌")

    mood_history[data.mood] += 1
    new_count = user.get("mood_search_count", 0) + 1

    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"Mood_History": mood_history, "mood_search_count": new_count, "updated_at": datetime.utcnow()}}
    )

    new_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    return {"message": f"Mood '{data.mood}' updated successfully ✅", "user": user_helper(new_user)}


# ✅ 6. Add/Remove single song in liked_Songs
class SongIdRequest(BaseModel):
    song_id: str

@router.put("/liked_songs/add/{user_id}")
async def add_liked_song(user_id: str, data: SongIdRequest):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID ❌")
    if not ObjectId.is_valid(data.song_id):
        raise HTTPException(status_code=400, detail="Invalid song_id ❌")

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found ❌")

    # Remove any legacy string entries for the same id, then add ObjectId canonically
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"liked_Songs": data.song_id}}
    )
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"liked_Songs": ObjectId(data.song_id)}, "$set": {"updated_at": datetime.utcnow()}}
    )

    new_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    msg = "Song added to likes ✅" if result.modified_count > 0 else "Song already in likes ✅"
    return {"message": msg, "user": user_helper(new_user)}

@router.put("/liked_songs/remove/{user_id}")
async def remove_liked_song(user_id: str, data: SongIdRequest):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID ❌")
    if not ObjectId.is_valid(data.song_id):
        raise HTTPException(status_code=400, detail="Invalid song_id ❌")

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found ❌")

    # Remove either ObjectId or legacy string entries matching the song id
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"liked_Songs": {"$in": [ObjectId(data.song_id), data.song_id]}}, "$set": {"updated_at": datetime.utcnow()}}
    )

    new_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    msg = "Song removed from likes ✅" if result.modified_count > 0 else "Song not present in likes ❌"
    return {"message": msg, "user": user_helper(new_user)}
