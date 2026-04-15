import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { searchTracks } from '../api/audiusClient.js';
import TrackCard from '../components/TrackCard.jsx';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const reqSeq = useRef(0);

  useEffect(() => {
    (async () => {
      if (!q) return setTracks([]);
      setLoading(true);
      const seq = ++reqSeq.current;
      try {
        const data = await searchTracks(q, { limit: 24 });
        // Ignore stale responses
        if (seq === reqSeq.current) setTracks(data);
      } finally {
        if (seq === reqSeq.current) setLoading(false);
      }
    })();
  }, [q]);

  return (
    <div>
      <Typography variant="h6" gutterBottom>Search results for "{q}"</Typography>
      {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}
      <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
        {tracks.map((t) => (
          <Grid size="auto" key={t.id}>
            <TrackCard track={t} list={tracks} />
          </Grid>
        ))}
      </Grid>
    </div>
  );
}