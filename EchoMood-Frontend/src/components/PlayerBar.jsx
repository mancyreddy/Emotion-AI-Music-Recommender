import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Forward10Icon from '@mui/icons-material/Forward10';
import Replay10Icon from '@mui/icons-material/Replay10';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { usePlayer } from '../context/PlayerContext.jsx';

export default function PlayerBar() {
  const { currentTrack, isPlaying, togglePlay, next, prev, progress, duration, seek, skipBy, volume, setVolume, beat, likedSongs, toggleLikeCurrent } = usePlayer();
  const liked = !!(currentTrack && likedSongs && likedSongs.has(currentTrack.id));

  return (
    <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid rgba(255,255,255,0.08)', px: 2, py: 1, background: 'rgba(18,19,26,0.9)', backdropFilter: 'blur(10px)' }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="subtitle2">{currentTrack ? currentTrack.title : 'Nothing playing'}</Typography>
          <Typography variant="caption" color="text.secondary">{currentTrack?.user?.name || ''}</Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={prev}><SkipPreviousIcon /></IconButton>
          <IconButton color="primary" onClick={togglePlay}>
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton onClick={next}><SkipNextIcon /></IconButton>
          <IconButton color={liked ? 'error' : 'default'} disabled={!currentTrack} onClick={toggleLikeCurrent} title={liked ? 'Unlike' : 'Like'}>
            {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <IconButton title="Back 10s" onClick={() => skipBy(-10)}><Replay10Icon /></IconButton>
          <IconButton title="Forward 10s" onClick={() => skipBy(10)}><Forward10Icon /></IconButton>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
          <Typography variant="caption">{format(progress)}</Typography>
          <Slider value={Math.min(progress, duration)} min={0} max={duration || 0} step={1} onChange={(_, v) => seek(v)} />
          <Typography variant="caption">{format(duration)}</Typography>
        </Stack>
        {/* Beat visualizer */}
        <Box className="beat-bars" sx={{ mx: 1 }} aria-hidden>
          {Array.from({ length: 20 }).map((_, i) => (
            <Box key={i} className="beat-bar" style={{ height: `${Math.max(4, (Math.sin(i * 0.8) * 0.5 + 0.5) * 12 * (0.4 + beat * 0.6))}px` }} />
          ))}
        </Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 180 }}>
          <VolumeUpIcon />
          <Slider value={volume} min={0} max={1} step={0.01} onChange={(_, v) => setVolume(v)} />
        </Stack>
      </Stack>
    </Box>
  );
}

function format(sec = 0) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}