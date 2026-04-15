import React, { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { addLikedSong, removeLikedSong } from '../api/usersClient.js';
import axios from 'axios';

const PlayerContext = createContext(null);

const APP_NAME = 'EchoMood';

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const [beat, setBeat] = useState(0);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [badTrackIds, setBadTrackIds] = useState(() => {
    try {
      const raw = localStorage.getItem('badTracks');
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [likedSongs, setLikedSongs] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      return new Set(u?.liked_Songs || []);
    } catch {
      return new Set();
    }
  });

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  useEffect(() => {
    setLikedSongs((prev) => {
      const next = new Set(user?.liked_Songs || Array.from(prev || []));
      return next;
    });
  }, [user?.liked_Songs]);

  useEffect(() => {
    const audio = audioRef.current;
    // Initialize safe defaults to avoid playback crashes
    audio.preload = 'auto';
    try { audio.crossOrigin = 'anonymous'; } catch {}
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => next();
    const onError = (e) => {
      console.warn('Audio playback error', e);
      const track = currentTrack;
      if (track?.id) {
        setBadTrackIds((prev) => {
          const next = new Set([...prev, track.id]);
          try { localStorage.setItem('badTracks', JSON.stringify(Array.from(next))); } catch {}
          return next;
        });
      }
      // Attempt to skip to the next playable track
      try { next(); } catch {}
      setIsPlaying(false);
      // Auto reload after 10 seconds to refresh lists and avoid bad tracks
      try { setTimeout(() => window.location.reload(), 10000); } catch {}
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    if (!currentTrack) return;
    const audio = audioRef.current;
    const url = `https://api.audius.co/v1/tracks/${currentTrack.id}/stream?app_name=${APP_NAME}`;
    audio.src = url;
    audio.load();
    // Setup analyser for beat visualization once
    try {
      if (!audioCtxRef.current) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.85;
        src.connect(analyser);
        // Route audio to speakers so playback is audible
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
      }
    } catch (err) {
      console.warn('Audio analyser init failed', err);
    }
    if (isPlaying) {
      try {
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.catch((err) => console.warn('Autoplay prevented or failed', err));
        }
      } catch (err) {
        console.warn('Play invocation failed', err);
        // Reset src to avoid stuck state
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [currentTrack]);

  // Beat visualization loop (runs continuously; uses analyser when available)
  useEffect(() => {
    let rafId = null;
    const bufRef = { buf: null };
    const loop = () => {
      try {
        const analyser = analyserRef.current;
        if (analyser) {
          if (!bufRef.buf || bufRef.buf.length !== analyser.frequencyBinCount) {
            bufRef.buf = new Uint8Array(analyser.frequencyBinCount);
          }
          analyser.getByteFrequencyData(bufRef.buf);
          let sum = 0;
          const start = 2, end = Math.min(20, bufRef.buf.length);
          for (let i = start; i < end; i++) sum += bufRef.buf[i];
          const avg = sum / (end - start);
          const level = Math.min(1, avg / 180);
          setBeat((prev) => prev * 0.85 + level * 0.15);
        }
      } catch {}
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => rafId && cancelAnimationFrame(rafId);
  }, []);

  const playTrack = (track, list = []) => {
    if (list && list.length) setQueue(list);
    const source = list && list.length ? list : queue;
    const idx = source.findIndex((t) => t.id === track.id);
    setCurrentIndex(idx >= 0 ? idx : 0);
    // Let the currentTrack effect handle .load() and .play() to avoid race conditions
    setIsPlaying(true);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!currentTrack) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        // Resume audio context if required by browser policies
        try {
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            await audioCtxRef.current.resume();
          }
        } catch {}
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          await p;
        }
        setIsPlaying(true);
      } catch (e) {
        console.error('Playback error', e);
      }
    }
  };

  const next = () => {
    if (!queue.length) return;
    let attempts = 0;
    let idx = currentIndex;
    while (attempts < queue.length) {
      idx = (idx + 1) % queue.length;
      const candidate = queue[idx];
      const isBad = badTrackIds?.has?.(candidate?.id);
      if (!isBad) {
        setCurrentIndex(idx);
        setIsPlaying(true);
        return;
      }
      attempts++;
    }
    // All tracks bad; stop playback
    setIsPlaying(false);
  };

  const prev = () => {
    if (!queue.length) return;
    let attempts = 0;
    let idx = currentIndex;
    while (attempts < queue.length) {
      idx = (idx - 1 + queue.length) % queue.length;
      const candidate = queue[idx];
      const isBad = badTrackIds?.has?.(candidate?.id);
      if (!isBad) {
        setCurrentIndex(idx);
        setIsPlaying(true);
        return;
      }
      attempts++;
    }
    setIsPlaying(false);
  };

  const seek = (sec) => {
    audioRef.current.currentTime = sec;
    setProgress(sec);
  };

  const skipBy = (delta) => {
    const audio = audioRef.current;
    const next = Math.max(0, Math.min((audio.currentTime || 0) + delta, duration || audio.duration || 0));
    audio.currentTime = next;
    setProgress(next);
  };

  const value = useMemo(
    () => ({
      audioRef,
      queue,
      setQueue,
      currentIndex,
      currentTrack,
      isPlaying,
      playTrack,
      togglePlay,
      next,
      prev,
      volume,
      setVolume,
      progress,
      duration,
      seek,
      skipBy,
      beat,
      badTrackIds,
      likedSongs,
      normalizeSongId(id) {
        try {
          if (/^[a-fA-F0-9]{24}$/.test(id)) return id.toLowerCase();
          // Deterministic 24-hex from arbitrary string (for backend ObjectId validation)
          let h = 0x811c9dc5;
          for (let i = 0; i < String(id).length; i++) {
            h ^= String(id).charCodeAt(i);
            h = (h * 16777619) >>> 0;
          }
          const hex = h.toString(16).padStart(8, '0') + (String(id).length % 256).toString(16).padStart(2, '0');
          return (hex + '0'.repeat(24)).slice(0, 24);
        } catch {
          return '0'.repeat(24);
        }
      },
      isLiked(trackId) {
        const nid = trackId ? this.normalizeSongId(trackId) : null;
        return !!(nid && likedSongs && likedSongs.has(nid));
      },
      async toggleLikeCurrent() {
        const t = currentTrack;
        if (!t || !user?.id) return;
        try {
          const nid = this.normalizeSongId(t.id);
          if (likedSongs.has(nid)) {
            const res = await removeLikedSong(user.id, nid);
            setLikedSongs((s) => {
              const n = new Set(s);
              n.delete(nid);
              return n;
            });
            if (res?.user) {
              setUser(res.user);
              try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
            }
          } else {
            const res = await addLikedSong(user.id, nid);
            setLikedSongs((s) => new Set([...Array.from(s), nid]));
            if (res?.user) {
              setUser(res.user);
              try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
            }
          }
        } catch (e) {
          console.warn('Like/unlike failed', e);
        }
      },
    }),
    [queue, currentIndex, currentTrack, isPlaying, volume, progress, duration, beat, badTrackIds, likedSongs, user]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export const usePlayer = () => useContext(PlayerContext);