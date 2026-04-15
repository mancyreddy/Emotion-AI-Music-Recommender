# EchoMood 🎵🧠

An AI-powered music recommendation platform that uses computer vision to detect your emotion and curates a customized playlist of songs tailored to your mood!

## 🚀 Features
- **Emotion Recognition**: Upload an image and let our Deep Learning model detect your exact facial expression/emotion.
- **Mood-Based Audius API Integration**: Automatically fetches matching music genres and songs from Audius to instantly match your vibe.
- **User Authentication**: Secure user registration, robust passwords, and JWT-like flow (MongoDB).
- **Interactive Listening History**: Keeps track of your detected moods and likes/dislikes.
- **Dynamic Modern UI**: Enjoy a sleek, dark-themed, glass-morphism dashboard out of the box!

<br>

## 🛠 Tech Stack
| Component | Technology | Description |
| --------- | ---------- | ----------- |
| **Frontend** | React, Vite | A blazing fast Single Page Application with dynamic theming. |
| **Backend** | Python, FastAPI | Serves our API and handles image uploads cleanly. |
| **Database** | MongoDB | Stores user profiles, mood search history, and favorite playlists securely. |
| **AI Model** | PyTorch | `EchoMoodCNN` handles real-time emotion inference from faces. |

<br>

## 💻 How to Run Locally

### 1. Start the Backend Server
This project requires a MongoDB Atlas Database URI (ensure you add it to the `.env` file first).
```bash
cd EchoMood-Backend
pip install -r requirements.txt
python -m uvicorn app:app --port 8000 --reload
```

### 2. Start the Frontend
In a new terminal window:
```bash
cd EchoMood-Frontend
npm install
npm run dev
```

Visit **[http://localhost:5173](http://localhost:5173)** to see the magic happen!

<br>

## 🌐 Deploying & Hosting
Because the AI Core uses PyTorch (which requires slightly heavier processing overhead), it is recommended to split deployments:
- **Frontend**: Deploy `EchoMood-Frontend` to [Vercel](https://vercel.com) (Serverless / Vite).
- **Backend API**: Deploy `EchoMood-Backend` as a Docker Container / Web Service to [Render](https://render.com) or [Railway](https://railway.app).

---

*Authored by **Mancy Reddy***
