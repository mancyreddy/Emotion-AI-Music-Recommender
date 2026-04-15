import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/usersClient.js';
import AnimatedBackground from '../components/AnimatedBackground.jsx';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await register({ username, email, password });
      setMessage(res?.message || 'Registered');
      if (res?.user) {
        localStorage.setItem('user', JSON.stringify(res.user));
        navigate('/');
      }
    } catch (err) {
      setMessage('Registration failed');
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
          <img src="/Logo.png" alt="EchoMood" height={96} style={{ display: 'block', borderRadius: 8 }} />
          <Typography variant="h4" fontWeight={750}>EchoMood</Typography>
        </Stack>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="h5">Register</Typography>
            <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {message && <Typography variant="body2">{message}</Typography>}
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Registering...' : 'Register'}</Button>
            <Typography variant="caption">Already have an account? <Link to="/login">Login</Link></Typography>
          </Stack>
        </form>
        </Paper>
      </Box>
    </>
  );
}