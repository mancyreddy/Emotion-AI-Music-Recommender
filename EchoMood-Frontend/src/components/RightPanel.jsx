import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function RightPanel() {
  const { currentTrack, togglePlay, isPlaying } = usePlayer();

  if (!currentTrack) {
    return (
      <Box sx={{ width: 320, borderLeft: '1px solid rgba(255,255,255,0.08)', p: 2 }}>
        <Typography variant="subtitle1">Song details</Typography>
        <Typography variant="body2" color="text.secondary">Select a track to view details.</Typography>
      </Box>
    );
  }

  const artwork = currentTrack?.artwork?.['480x480'] || currentTrack?.artwork?.['150x150'] || undefined;
  const fallbackCover = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
      <defs>
        <linearGradient id='g' x1='0' x2='1'>
          <stop offset='0%' stop-color='#4300FF'/>
          <stop offset='50%' stop-color='#0065F8'/>
          <stop offset='100%' stop-color='#00CAFF'/>
        </linearGradient>
      </defs>
      <rect fill='url(#g)' width='100%' height='100%'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#ffffff' font-size='28' font-family='Arial'>EchoMood</text>
    </svg>`);
  const shouldProxyHost = (url) => {
    try {
      const h = new URL(url).hostname;
      return (
        h.includes('audius.co') ||
        h.includes('creatornode') ||
        h.includes('audius-content') ||
        h.includes('audius-discovery') ||
        h.includes('cultur3stake.com') ||
        h.includes('theblueprint.xyz') ||
        h.includes('figment.io')
      );
    } catch {
      return false;
    }
  };
  const proxifyIfNeeded = (url) => (url && shouldProxyHost(url) ? `/img-proxy?url=${encodeURIComponent(url)}` : url);
  const displayArtwork = artwork ? proxifyIfNeeded(artwork) : fallbackCover;
  // Normalize tags to an array of strings before joining
  const rawTags = currentTrack?.tags;
  const tagsArr = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string'
    ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  const fields = [
    { label: 'Title', value: currentTrack.title },
    { label: 'Artist', value: currentTrack.user?.name },
    { label: 'Genre', value: currentTrack.genre },
    { label: 'Mood', value: currentTrack.mood },
    { label: 'Release Date', value: currentTrack.release_date },
    { label: 'Duration', value: currentTrack.duration },
    { label: 'Visualizer', value: currentTrack.visualizer },
    { label: 'Tags', value: tagsArr.join(', ') },
    { label: 'Description', value: currentTrack.description },
    { label: 'ISRC', value: currentTrack.isrc },
  ].filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

  return (
    <Box sx={{ width: 320, borderLeft: '1px solid rgba(255,255,255,0.08)', p: 2 }}>
      <Paper className="glass" sx={{ p: 2 }}>
        <Stack spacing={2}>
          {displayArtwork && (
            <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <img
                src={displayArtwork}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = fallbackCover;
                }}
                style={{ width: '100%', display: 'block' }}
              />
            </Box>
          )}
          <Box>
            <Typography variant="h6" gutterBottom>{currentTrack.title}</Typography>
            <Typography variant="body2" color="text.secondary">{currentTrack.user?.name}</Typography>
          </Box>
          <Button variant="contained" onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</Button>
          <Divider textAlign="left">Details</Divider>
          <Stack spacing={1}>
            {fields.map((f) => (
              <Box key={f.label} sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="caption" sx={{ minWidth: 110, color: 'text.secondary' }}>{f.label}</Typography>
                <Typography variant="caption" sx={{ flex: 1 }}>{String(f.value)}</Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}