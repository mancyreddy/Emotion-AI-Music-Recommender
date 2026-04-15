# db.py
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# ✅ Connect to MongoDB
client = AsyncIOMotorClient(MONGODB_URI)
db = client[DB_NAME]

# ✅ Directly expose the collection
users_collection = db["users"]
