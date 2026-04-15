import React from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export default function Playlists() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Your Playlists</Typography>
      <Paper className="glass" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">Playlist management coming soon.</Typography>
      </Paper>
    </Box>
  );
}