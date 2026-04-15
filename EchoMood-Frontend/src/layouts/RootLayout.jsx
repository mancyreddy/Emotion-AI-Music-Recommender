import React from 'react';
import Box from '@mui/material/Box';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import RightPanel from '../components/RightPanel.jsx';
import PlayerBar from '../components/PlayerBar.jsx';
import { Outlet, useNavigate } from 'react-router-dom';
import { PlayerProvider } from '../context/PlayerContext.jsx';
import AppErrorBoundary from '../components/AppErrorBoundary.jsx';

export default function RootLayout() {
  const navigate = useNavigate();
  const handleSearch = (q) => navigate(`/search?q=${encodeURIComponent(q)}`);
  const [collapsed, setCollapsed] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('sidebarCollapsed') || 'false'); } catch { return false; }
  });
  const toggleSidebar = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(next));
      return next;
    });
  };
  return (
    <AppErrorBoundary>
      <PlayerProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Navbar onSearch={handleSearch} />
          <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
            <Box sx={{ flex: 1, p: 2, pb: 12, overflow: 'auto' }}>
              <Outlet />
            </Box>
            <RightPanel />
          </Box>
          <PlayerBar />
        </Box>
      </PlayerProvider>
    </AppErrorBoundary>
  );
}