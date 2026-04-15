import React, { useMemo, useRef, useState } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ImageIcon from '@mui/icons-material/Image';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { usePlayer } from '../context/PlayerContext.jsx';
import { predictFromImage, updateUserMood } from '../api/usersClient.js';
import { searchStreamableTracks, searchTracks } from '../api/audiusClient.js';

const EMOTION_TO_GENRE = {
  angry: 'rock',
  disgust: 'metal',
  fear: 'ambient',
  happy: 'pop',
  neutral: 'chill',
  sad: 'acoustic',
  surprise: 'electronic',
};

function formatDuration(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}

export default function Echo() {
  const { playTrack } = usePlayer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predictedMood, setPredictedMood] = useState('');
  const [songs, setSongs] = useState([]);
  const [imageName, setImageName] = useState('');
  const inputRef = useRef(null);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  const userId = useMemo(() => {
    const raw = user?.id || user?._id || user?.user_id;
    if (!raw) return null;
    if (typeof raw === 'string') return raw.match(/[a-f0-9]{24}/i)?.[0] || raw;
    if (raw && typeof raw === 'object' && '$oid' in raw) return raw.$oid;
    return String(raw);
  }, [user?.id, user?._id, user?.user_id]);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    setError('');
    setLoading(true);
    try {
      const data = await predictFromImage(file);
      const mood = data?.predicted_emotion || data?.mood || '';
      setPredictedMood(mood || '');
      // Replace existing list with top 10 liked songs by mapped genre
      try {
        const genre = EMOTION_TO_GENRE[(mood || '').toLowerCase()] || 'pop';
        const found = await searchTracks(genre, { limit: 60 });
        const sorted = [...found].sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0));
        setSongs(sorted.slice(0, 10));
      } catch (gErr) {
        // Fallback to any recommendations from /predict response
        const recs = Array.isArray(data?.recommended_songs) ? data.recommended_songs : [];
        const list = recs.map((t, idx) => ({
          id: t.id || String(t.track_id || idx),
          title: t.title || t.orig_filename || 'Untitled',
          user: t.user || null,
          artwork: t.artwork || null,
          created_at: t.created_at || null,
          duration: t.duration || null,
          genre: t.genre || t.description || null,
        }));
        setSongs(list);
      }
      // Update user mood in backend
      try {
        if (userId && mood) {
          await updateUserMood(userId, mood);
          const next = { ...(user || {}), mood: mood, mood_search_count: (user?.mood_search_count || 0) + 1 };
          try { localStorage.setItem('user', JSON.stringify(next)); } catch {}
        }
      } catch (err) {
        console.warn('Mood update failed', err);
      }
    } catch (err) {
      console.warn('Predict failed', err);
      const backendMsg = err?.response?.data?.message || err?.response?.data?.detail || err?.message;
      setError(backendMsg || 'Failed to analyze image');
    } finally {
      setLoading(false);
      // Reset input so the same file can be reselected
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setPredictedMood('');
    setSongs([]);
    setImageName('');
    setError('');
  };

  const handlePlay = (track) => {
    if (!track || !track.id) return;
    playTrack(track, songs);
  };

  return (
    <Paper className="glass" sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <EmojiEmotionsIcon />
        <Typography variant="h6">Echo Your Mood</Typography>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <Button variant="contained" startIcon={<ImageIcon />} onClick={handlePick}>Upload image</Button>
        {!!imageName && <Chip label={imageName} variant="outlined" />}
        {!!predictedMood && <Chip color="primary" label={`Mood: ${predictedMood}`} />}
        {!!songs.length && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="mood-select-label">Change mood</InputLabel>
            <Select
              labelId="mood-select-label"
              label="Change mood"
              value={predictedMood || ''}
              onChange={async (e) => {
                const m = e.target.value;
                setPredictedMood(m);
                try {
                  if (userId && m) await updateUserMood(userId, m);
                } catch (err) {
                  console.warn('Mood update failed', err);
                }
                // Load top 10 liked songs by mapped genre and replace list
                try {
                  const genre = EMOTION_TO_GENRE[(m || '').toLowerCase()] || 'pop';
                  setLoading(true);
                  const found = await searchTracks(genre, { limit: 60 });
                  const sorted = [...found].sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0));
                  setSongs(sorted.slice(0, 10));
                } catch (loadErr) {
                  console.warn('Failed to load songs for mood', loadErr);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {['angry','disgust','fear','happy','neutral','sad','surprise'].map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {!!songs.length && (
          <Button variant="text" color="secondary" startIcon={<RestartAltIcon />} onClick={handleReset}>Upload another image / Change mood</Button>
        )}
      </Stack>

      {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}
      {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!!songs.length && (
        <TableContainer component={Paper} sx={{ background: 'transparent' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Album</TableCell>
                <TableCell>Added by</TableCell>
                <TableCell>Date added</TableCell>
                <TableCell align="right">Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {songs.map((t, idx) => (
                <TableRow key={t.id || idx} hover sx={{ cursor: 'pointer' }} onClick={() => handlePlay(t)}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={t?.artwork?.['150x150'] || undefined} variant="rounded" sx={{ width: 32, height: 32 }} />
                      <Stack>
                        <Typography variant="body2" noWrap title={t.title}>{t.title}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{t.user?.handle || t.user?.username || t.user?.id || 'Unknown'}</Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>{t.genre || '—'}</TableCell>
                  <TableCell>{t.user?.handle || t.user?.username || t.user?.id || '—'}</TableCell>
                  <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</TableCell>
                  <TableCell align="right">{formatDuration(t.duration)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';