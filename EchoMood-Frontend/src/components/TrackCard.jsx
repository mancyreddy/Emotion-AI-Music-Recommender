import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { motion } from 'framer-motion';
import { usePlayer } from '../context/PlayerContext.jsx';

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

function TrackCardInner({ track, list }) {
  const { playTrack } = usePlayer();
  // Prefer higher resolution artwork when available
  const art480 = track?.artwork?.['480x480'];
  const art150 = track?.artwork?.['150x150'];
  const initialArtwork = art480 || art150 || undefined;
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
  const displayArtwork = initialArtwork ? proxifyIfNeeded(initialArtwork) : fallbackCover;
  // Width clamp based on image aspect ratio to avoid overly wide/narrow cards
  const [cardW, setCardW] = useState(220);
  const clampWidth = (ratio) => {
    const target = ratio * 200; // 200px image height
    const min = 200;
    const max = 280;
    return Math.max(min, Math.min(max, target));
  };
  // removed blocked-host skip in favor of local proxy to display images

  return (
    <motion.div
      className="card-3d"
      style={{ perspective: 1000, display: 'inline-block' }}
      whileHover={{ rotateY: 360, scale: 1.06 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, duration: 1.2 }}
    >
      <Paper className="glass" sx={{ p: 1, height: 300, display: 'inline-flex', flexDirection: 'column', transformStyle: 'preserve-3d', width: cardW }}>
        <Box sx={{ borderRadius: 2, overflow: 'hidden', position: 'relative', height: 200, backgroundColor: 'rgba(255,255,255,0.04)', width: '100%' }}>
          <img
            src={displayArtwork}
            alt={track.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // If proxy or remote fails, go straight to placeholder to avoid repeated errors
              e.currentTarget.src = fallbackCover;
            }}
            onLoad={(e) => {
              const nw = e.currentTarget.naturalWidth || 180;
              const nh = e.currentTarget.naturalHeight || 180;
              const ratio = nw / nh || 1;
              setCardW(clampWidth(ratio));
            }}
            style={{ height: '100%', width: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
          <IconButton color="primary" onClick={() => playTrack(track, list)} sx={{ position: 'absolute', bottom: 8, right: 8 }}>
            <PlayArrowIcon />
          </IconButton>
        </Box>
        <Box sx={{ mt: 1, minHeight: 64 }}>
          <Typography variant="subtitle2" noWrap title={track.title}>{track.title}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {track.user?.name}
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
}

const TrackCard = React.memo(TrackCardInner);
export default TrackCard;