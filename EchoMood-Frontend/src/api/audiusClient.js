import axios from 'axios';

const api = axios.create({ baseURL: 'https://api.audius.co/v1' });
const APP_NAME = 'EchoMood';

export async function getTrendingTracks({ timeRange = 'week', limit = 20 } = {}) {
  const { data } = await api.get('/tracks/trending', { params: { timeRange, limit } });
  return data?.data || [];
}

export async function searchTracks(query, { limit = 20 } = {}) {
  const { data } = await api.get('/tracks/search', { params: { query, limit } });
  return data?.data || [];
}

export function streamUrl(id) {
  return `https://api.audius.co/v1/tracks/${id}/stream?app_name=${APP_NAME}`;
}

// Avoid probing creator node streams (Cloudflare often returns 403 to HEAD/Range).
// Let the player attempt playback and handle failures gracefully.
export async function hasStream(id) {
  return true;
}

async function filterStreamable(list) {
  // No-op filter to prevent HEAD/GET probes that trigger 403 on creator nodes.
  return list;
}

export async function getTrendingStreamableTracks({ timeRange = 'week', limit = 40 } = {}) {
  const base = await getTrendingTracks({ timeRange, limit });
  return filterStreamable(base);
}

export async function searchStreamableTracks(query, { limit = 30 } = {}) {
  const base = await searchTracks(query, { limit });
  return filterStreamable(base);
}

// Fetch a larger pool, sort by likes, then return top N that are streamable
export async function getTopLikedStreamableTracks({ timeRange = 'week', poolLimit = 200, topLimit = 100 } = {}) {
  const safeLimit = Math.min(poolLimit, 100);
  const pool = await getTrendingTracks({ timeRange, limit: safeLimit });
  const sorted = [...pool].sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0));
  // Check streamability with modest concurrency to reduce network noise
  const streamable = await filterStreamable(sorted, { concurrency: 4 });
  return streamable.slice(0, topLimit);
}