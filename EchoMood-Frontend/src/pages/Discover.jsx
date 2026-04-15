import React, { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { getTrendingTracks } from '../api/audiusClient.js';
import TrackCard from '../components/TrackCard.jsx';
import { usePlayer } from '../context/PlayerContext.jsx';
import Box from '@mui/material/Box';

export default function Discover() {
  const [tracks, setTracks] = useState([]);
  const { badTrackIds } = usePlayer();
  useEffect(() => {
    (async () => {
      const data = await getTrendingTracks({ timeRange: 'month', limit: 100 });
      setTracks(data);
    })();
  }, []);

  const grouped = useMemo(() => {
    const filtered = tracks.filter((t) => !badTrackIds?.has?.(t.id));
    const sorted = filtered.sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0));
    const map = new Map();
    for (const t of sorted) {
      const g = (t.genre || 'Unknown').trim();
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(t);
    }
    return map;
  }, [tracks, badTrackIds]);

  return (
    <div>
      <Typography variant="h5" gutterBottom>Discover</Typography>
      {[...grouped.keys()].map((genre) => (
        <Box key={genre} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>{genre}</Typography>
          <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
            {grouped.get(genre).map((t) => (
              <Grid size="auto" key={t.id}>
                <TrackCard track={t} list={grouped.get(genre)} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </div>
  );
}