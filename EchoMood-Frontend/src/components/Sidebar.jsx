import React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import HomeIcon from '@mui/icons-material/Home';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  // Read user on each render so route changes after login reflect immediately
  const user = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const links = [
    { to: '/', label: 'Home', icon: <HomeIcon /> },
    { to: '/discover', label: 'Discover', icon: <WhatshotIcon /> },
    { to: '/playlists', label: 'Playlists', icon: <LibraryMusicIcon /> },
    // Show Echo and Profile only when logged in
    ...(user ? [
      { to: '/echo', label: 'Echo Your Mood', icon: <EmojiEmotionsIcon /> },
      { to: '/profile', label: 'Profile', icon: <PersonIcon /> },
    ] : []),
  ];

  const width = collapsed ? 72 : 240;
  return (
    <Box className="sidebar-animated" sx={{ width, transition: 'width 200ms ease', borderRight: '1px solid rgba(255,255,255,0.08)', p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <IconButton size="small" onClick={onToggle} title="Toggle sidebar">
          <MenuIcon />
        </IconButton>
      </Box>
      <List>
        {links.map((l, idx) => (
          <motion.div key={l.to} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300, damping: 25 }}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate(l.to)} sx={{ borderRadius: 1, position: 'relative' }}>
                <ListItemIcon>{l.icon}</ListItemIcon>
                {!collapsed && <ListItemText primary={l.label} />}
              </ListItemButton>
            </ListItem>
          </motion.div>
        ))}
      </List>
      <Divider />
      {!collapsed && (
        <Box sx={{ p: 2, fontSize: 12, color: 'text.secondary' }}>
          © EchoMood
        </Box>
      )}
    </Box>
  );
}