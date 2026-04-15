import React, { useEffect, useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { usePlayer } from '../context/PlayerContext.jsx';
import { getUser, updateUser } from '../api/usersClient.js';

export default function Profile() {
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);
  const { currentTrack, next } = usePlayer();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [form, setForm] = useState({ email: '', username: '', date_of_birth: '', gender: '', country: '', profilepic: '', bio: '' });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let alive = true;
    const fetchDetails = async () => {
      const uid = user?.id || user?._id || user?.user_id;
      if (!uid) return;
      setLoading(true);
      try {
        const data = await getUser(uid);
        if (!alive) return;
        setDetails(data);
      } catch (e) {
        if (!alive) return;
        setError('Unable to load user details');
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchDetails();
    return () => { alive = false; };
  }, [user?.id, user?._id, user?.user_id]);

  if (!user) {
    return <Typography variant="body1">You are not logged in.</Typography>;
  }

  const info = { ...user, ...(details || {}) };
  const joined = info.createdAt || info.created_at || info.joinedAt || null;
  const website = info.website || info.link || null;
  const location = info.location || info.city || null;
  const name = info.name || info.fullName || info.username;
  const bio = info.bio || info.about || null;
  const followers = info.followers ?? info.follower_count ?? info.stats?.followers ?? null;
  const following = info.following ?? info.following_count ?? info.stats?.following ?? null;
  const playlists = info.playlists_count ?? info.playlists?.length ?? null;

  // Prepare form fields when details arrive
  useEffect(() => {
    const f = {
      email: info.email || '',
      username: info.username || '',
      date_of_birth: info.date_of_birth || info.dob || '',
      gender: info.gender || '',
      country: info.country || '',
      profilepic: info.profilepic || info.avatar || '',
      bio: info.bio || '',
    };
    setForm((prev) => ({ ...prev, ...f }));
  }, [info.email, info.username, info.date_of_birth, info.gender, info.country, info.profilepic, info.bio]);

  const normalizeUserId = (raw) => {
    if (!raw) return null;
    if (typeof raw === 'string') {
      const m = raw.match(/[a-f0-9]{24}/i);
      return m ? m[0] : raw;
    }
    if (raw && typeof raw === 'object' && '$oid' in raw) return raw.$oid;
    try { return String(raw); } catch { return null; }
  };
  const userId = normalizeUserId(info.id || info._id || info.user_id || user?.id || user?._id || user?.user_id || null);

  const getTopMood = () => {
    const mh = info.Mood_History || info.mood_history;
    if (!mh) return null;

    let best = null;
    const ignore = new Set(['created_at', 'updated_at']);
    const push = (name, val) => {
      const n = String(name || '').trim();
      const v = Number(val);
      if (!n || !isFinite(v)) return;
      if (!best || v > best.count) best = { name: n, count: v };
    };

    if (Array.isArray(mh)) {
      mh.forEach((x) => x && push(x.name || x.mood || x.label, x.count ?? x.value ?? x.val));
    } else if (typeof mh === 'object') {
      for (const [k, v] of Object.entries(mh)) {
        if (ignore.has(k)) continue;
        if (typeof v === 'number') push(k, v);
      }
      if (Array.isArray(mh.counts)) mh.counts.forEach((x) => x && push(x.name, x.count));
      if (Array.isArray(mh.moods)) mh.moods.forEach((x) => x && push(x.name, x.count));
    }

    return best;
  };

  const topMood = getTopMood();
  const moodSearchCount = info.mood_search_count ?? info.moodSearchCount ?? null;

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const payload = {
        email: form.email || null,
        username: form.username || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        country: form.country || null,
        profilepic: form.profilepic || null,
        bio: form.bio || null,
      };
      const res = await updateUser(userId, payload);
      const updated = res?.user || payload;
      setDetails((d) => ({ ...(d || {}), ...(updated || {}) }));
      // Persist minimal user fields locally
      const nextLocal = { ...(user || {}), ...(updated || {}) };
      try { localStorage.setItem('user', JSON.stringify(nextLocal)); } catch {}
      setSaveMsg('Saved successfully');
      setEditing(false);
    } catch (e) {
      console.warn('Update failed', e);
      setSaveMsg('Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 2500);
    }
  };

  return (
    <Paper className="glass" sx={{ p: 3 }}>
      <Stack direction="row" spacing={3} alignItems="center">
        <Avatar src={info.profilepic || info.avatar || undefined} alt={name} sx={{ width: 96, height: 96 }} />
        <div>
          <Typography variant="h6" title={name}>{name}</Typography>
          <Typography variant="body2" color="text.secondary">{info.email}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {followers != null && <Chip label={`Followers: ${followers}`} size="small" />}
            {following != null && <Chip label={`Following: ${following}`} size="small" />}
            {playlists != null && <Chip label={`Playlists: ${playlists}`} size="small" />}
          </Stack>
        </div>
      </Stack>

      <Divider sx={{ my: 3 }} />
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>About</Typography>
          <Typography variant="body2" color="text.secondary">{bio || 'No bio provided.'}</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            {location && <Chip label={location} variant="outlined" />}
            {website && (
              <Link href={website} target="_blank" rel="noopener" underline="hover">Website</Link>
            )}
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Details</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">ID: <strong>{userId || '—'}</strong></Typography>
            <Typography variant="body2">Email: <strong>{info.email || '—'}</strong></Typography>
            <Typography variant="body2">Date of Birth: <strong>{info.date_of_birth ? new Date(info.date_of_birth).toLocaleDateString() : '—'}</strong></Typography>
            <Typography variant="body2">Gender: <strong>{info.gender || '—'}</strong></Typography>
            <Typography variant="body2">Country: <strong>{info.country || '—'}</strong></Typography>
            <Typography variant="body2">Created At: <strong>{joined ? new Date(joined).toLocaleString() : '—'}</strong></Typography>
            <Typography variant="body2">Updated At: <strong>{(info.updated_at || info.updatedAt) ? new Date(info.updated_at || info.updatedAt).toLocaleString() : '—'}</strong></Typography>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Mood Stats</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`Top Mood: ${topMood ? topMood.name : '—'}`} size="small" />
            <Chip label={`Count: ${topMood ? topMood.count : 0}`} size="small" />
            {moodSearchCount != null && <Chip label={`Search Count: ${moodSearchCount}` } size="small" />}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Account</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">User ID: <strong>{userId || '—'}</strong></Typography>
            <Typography variant="body2">Username: <strong>{info.username}</strong></Typography>
            <Typography variant="body2">Joined: <strong>{joined ? new Date(joined).toLocaleDateString() : '—'}</strong></Typography>
          </Stack>
          

          <Divider sx={{ my: 2 }} />
          {!editing ? (
            <Button variant="outlined" onClick={() => setEditing(true)}>Edit</Button>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Edit Profile</Typography>
              <Stack spacing={2}>
                <TextField label="Email" value={form.email} onChange={handleChange('email')} size="small" />
                <TextField label="Username" value={form.username} onChange={handleChange('username')} size="small" />
                <TextField label="Date of Birth" type="date" value={form.date_of_birth ? String(form.date_of_birth).slice(0,10) : ''} onChange={handleChange('date_of_birth')} size="small" InputLabelProps={{ shrink: true }} />
                <FormControl size="small">
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select labelId="gender-label" label="Gender" value={form.gender || ''} onChange={handleChange('gender')}>
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Country" value={form.country} onChange={handleChange('country')} size="small" />
                <TextField label="Bio" value={form.bio} onChange={handleChange('bio')} size="small" multiline minRows={3} />
                <TextField label="Profile Pic URL" value={form.profilepic} onChange={handleChange('profilepic')} size="small" />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button variant="contained" disabled={saving || !userId} onClick={handleSave}>Save</Button>
                  <Button variant="text" color="inherit" onClick={() => setEditing(false)}>Cancel</Button>
                  {saving && <Typography variant="caption" color="text.secondary">Saving...</Typography>}
                  {!!saveMsg && <Typography variant="caption" color={saveMsg.includes('fail') ? 'error' : 'success.main'}>{saveMsg}</Typography>}
                </Stack>
              </Stack>
            </>
          )}
        </Grid>
      </Grid>

      {loading && <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>Loading details...</Typography>}
      {error && <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>{error}</Typography>}
    </Paper>
  );
}