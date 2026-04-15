import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { getTrendingTracks } from '../api/audiusClient.js';
import TrackCard from '../components/TrackCard.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function Home() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  // Keep UI simple; no error text rendering
  const { badTrackIds } = usePlayer();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const pool = await getTrendingTracks({ timeRange: 'week', limit: 48 });
        const sorted = [...pool].sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0));
        setTracks(sorted);
      } catch (e) {
        console.warn('Failed to load tracks', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <Typography variant="h5" gutterBottom>Trending this week</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
          {tracks.filter((t) => !badTrackIds?.has?.(t.id)).map((t, idx) => (
            <Grid size="auto" key={t.id || idx}>
              <TrackCard track={t} list={tracks} />
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}