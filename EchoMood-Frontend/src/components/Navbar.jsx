import React, { useEffect, useMemo, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onSearch }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch?.(query.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Debounced navigate on input to make search feel instant
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return; // avoid noisy navigation for short queries
    const id = setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }, 400);
    return () => clearTimeout(id);
  }, [query, navigate]);

  return (
    <AppBar position="sticky" elevation={0} className="navbar-animated" sx={{ background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Toolbar sx={{ py: 1, gap: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
          <motion.div whileHover={{ scale: 1.05, rotateX: 6, rotateY: -6 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}> 
              <Box sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
                <img src="/Logo.png" alt="EchoMood" height="55" style={{ display: 'block' }} />
              </Box>
              <Box className="brand-gradient" sx={{ p: 0.75, borderRadius: 1.5 }}>
                <Typography variant="h6" fontWeight={800}>EchoMood</Typography>
              </Box>
            </Stack>
          </motion.div>
          <Box component="form" onSubmit={handleSearch} sx={{ flex: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tracks, artists, playlists"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="nav-search"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {user ? (
            <>
              <Typography
                variant="body2"
                sx={{ mr: 1, cursor: 'pointer' }}
                title="Open profile"
                onClick={() => navigate('/profile')}
              >
                {user.username}
              </Typography>
              <Avatar
                src={user.profilepic || undefined}
                alt={user.username}
                sx={{ bgcolor: 'primary.main', cursor: 'pointer' }}
                onClick={() => navigate('/profile')}
                title="Open profile"
              >
                {!user.profilepic && user.username ? user.username.charAt(0).toUpperCase() : null}
              </Avatar>
              <IconButton color="inherit" onClick={handleLogout} title="Logout">
                <LogoutIcon />
              </IconButton>
            </>
          ) : (
            <Typography variant="body2" sx={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>
              Login
            </Typography>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}