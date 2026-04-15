import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/usersClient.js';
import AnimatedBackground from '../components/AnimatedBackground.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await login({ email, password });
      if (res?.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
        navigate('/');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
        <Paper
          className="glass"
          sx={{
            width: '100%',
            maxWidth: 420,
            p: 3,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
            border: '1px solid rgba(255,255,255,0.07)'
          }}
        >
        <Stack component={Link} to="/" alignItems="center" spacing={1} sx={{ mb: 2, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <img src="/Logo.png" alt="EchoMood"  height={96} style={{ display: 'block', borderRadius: 8 }} />
          <Typography variant="h4" fontWeight={750}>EchoMood</Typography>
        </Stack>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="h6">Login</Typography>
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <Typography color="error" variant="body2">{error}</Typography>}
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
            <Typography variant="caption">Don't have an account? <Link to="/register">Register</Link></Typography>
          </Stack>
        </form>
        </Paper>
      </Box>
    </>
  );
}