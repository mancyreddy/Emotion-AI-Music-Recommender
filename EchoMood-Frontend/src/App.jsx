import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout.jsx';
import Home from './pages/Home.jsx';
import Discover from './pages/Discover.jsx';
import Playlists from './pages/Playlists.jsx';

import Search from './pages/Search.jsx';
import Echo from './pages/Echo.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/echo" element={<Echo />} />
        <Route path="/search" element={<Search />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
