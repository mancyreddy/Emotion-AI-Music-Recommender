# app.py
from fastapi import FastAPI, UploadFile, File
import torch
from torchvision import transforms
from PIL import Image
import io
from model_def import EchoMoodCNN
import requests
from routes.user_routes import router as user_router

app = FastAPI(title="EchoMood Backend 🧠🎵")

# ✅ Include user routes
app.include_router(user_router, prefix="/users", tags=["User"])

# ✅ Load model architecture
num_classes = 7  # angry, disgust, fear, happy, neutral, sad, surprise
model = EchoMoodCNN(num_classes=num_classes)

# ✅ Load weights
state_dict = torch.load("best_model.pth", map_location=torch.device('cpu'))
model.load_state_dict(state_dict["model_state_dict"])
model.eval()

# ✅ Preprocessing
transform = transforms.Compose([
    transforms.Resize((96, 96)),
    transforms.ToTensor(),
])

# ✅ Emotion → Genre mapping
EMOTION_TO_GENRE = {
    "angry": "rock",
    "disgust": "metal",
    "fear": "ambient",
    "happy": "pop",
    "neutral": "chill",
    "sad": "acoustic",
    "surprise": "electronic"
}

def Emotion_to_Gener(emotion: str) -> str:
    return EMOTION_TO_GENRE.get(emotion, "pop")


# ✅ Fetch ALL details for songs by genre from Audius API
def get_songs_by_genre(genre: str):
    url = f"https://discoveryprovider.audius.co/v1/tracks/search?query={genre}&app_name=EchoMood"
    response = requests.get(url)

    # Error handling
    if response.status_code != 200:
        return [{
            "error": True,
            "message": f"API Error {response.status_code}"
        }]

    data = response.json()

    # ⬅️ Instead of selecting specific fields, return full track data
    tracks = data.get("data", [])

    # Optional: Limit to 10 tracks (remove this if you want unlimited)
    tracks = tracks[:10]

    return tracks or [{"message": f"No songs found for {genre} 😢"}]


@app.get("/")
def home():
    return {"message": "EchoMood Backend is running successfully 🚀"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img_tensor)
        predicted_idx = torch.argmax(outputs, dim=1).item()
        emotion = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"][predicted_idx]

    genre = Emotion_to_Gener(emotion)
    songs = get_songs_by_genre(genre)

    return {"predicted_emotion": emotion, "genre": genre, "recommended_songs": songs}
