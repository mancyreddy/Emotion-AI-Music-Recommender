import axios from 'axios';

// Use Vite proxy: requests to /users go to backend without CORS preflight
const api = axios.create({ baseURL: '' });

export async function login(payload) {
  const { data } = await api.post('/users/login', payload, { headers: { 'Content-Type': 'application/json' } });
  return data;
}

export async function register(payload) {
  const { data } = await api.post('/users/register', payload, { headers: { 'Content-Type': 'application/json' } });
  return data;
}

export async function getUser(userId) {
  const { data } = await api.get(`/users/${userId}`);
  return data;
}

export async function updateUser(userId, payload) {
  const { data } = await api.put(`/users/update/${userId}`, payload, { headers: { 'Content-Type': 'application/json' } });
  return data;
}

// Update mood of the user by predicted/selected mood
export async function updateUserMood(userId, mood) {
  const { data } = await api.put(`/users/update_mood/${userId}`, { mood }, { headers: { 'Content-Type': 'application/json' } });
  return data;
}

// Upload an image to the /predict endpoint to get mood and songs
export async function predictFromImage(file) {
  // Try common field names: first 'file', then fallback to 'image'
  const tryPost = async (fieldName) => {
    const form = new FormData();
    form.append(fieldName, file);
    const { data } = await api.post('/predict', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  };
  try {
    return await tryPost('file');
  } catch (e1) {
    try {
      return await tryPost('image');
    } catch (e2) {
      // Prefer backend error message if available
      const msg = e2?.response?.data?.message || e2?.message || e1?.message || 'Predict failed';
      const err = new Error(msg);
      err.response = e2?.response || e1?.response;
      throw err;
    }
  }
}

export async function addLikedSong(userId, songId) {
  const { data } = await api.put(`/users/liked_songs/add/${userId}`, { song_id: songId }, { headers: { 'Content-Type': 'application/json' } });
  return data;
}

export async function removeLikedSong(userId, songId) {
  const { data } = await api.put(`/users/liked_songs/remove/${userId}`, { song_id: songId }, { headers: { 'Content-Type': 'application/json' } });
  return data;
}