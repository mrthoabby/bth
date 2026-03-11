'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiveKitRoom,
  useRoomContext,
  useTracks,
  VideoTrack,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent } from 'livekit-client';

interface ChatMsg { id: string; sender: string; text: string; time: string; }

const SECRET = 'power';

// ─── Types ────────────────────────────────────────────────────────────────────
type MediaItem =
  | { type: 'video'; name: string; size: number; mtime: number }
  | { type: 'photo'; session: string; name: string; size: number; mtime: number };

// ─── Secret code gate ─────────────────────────────────────────────────────────
function CodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);

  const tryUnlock = () => {
    if (value.trim().toLowerCase() === SECRET) {
      onUnlock();
    } else {
      setShake(true);
      setValue('');
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#060b14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 20, padding: 24,
    }}>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2.8 }}
        style={{ fontSize: 52 }}
      >
        🔒
      </motion.div>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'monospace', margin: 0 }}>
        Código de acceso
      </p>
      <motion.input
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
        autoFocus
        placeholder="••••••"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1.5px solid rgba(255,255,255,0.14)',
          borderRadius: 12, padding: '12px 20px',
          color: '#fff', fontSize: 22, outline: 'none',
          width: 200, textAlign: 'center', letterSpacing: '0.25em',
          fontFamily: 'monospace',
        }}
      />
      <button
        onClick={tryUnlock}
        style={{
          padding: '10px 32px',
          background: value.trim() ? 'rgba(175,55,78,0.85)' : 'rgba(60,30,40,0.5)',
          border: '1px solid rgba(175,55,78,0.4)',
          borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 14,
          fontFamily: 'monospace',
        }}
      >
        Entrar
      </button>
    </div>
  );
}

// ─── Media panel ──────────────────────────────────────────────────────────────
function MediaPanel() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [active, setActive] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<'video' | 'photo'>('video');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/recordings')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteAll = useCallback(async () => {
    if (!confirm('¿Borrar todas las grabaciones y fotos?')) return;
    setDeleting(true);
    await fetch('/api/recordings', { method: 'DELETE' }).catch(() => {});
    setItems([]);
    setActive(null);
    setDeleting(false);
  }, []);

  const fmt = (bytes: number) =>
    bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${(bytes / 1000).toFixed(0)} KB`;

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleString('es', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const srcFor = (item: MediaItem) => {
    if (item.type === 'photo') {
      return `/api/recordings/file?session=${encodeURIComponent(item.session)}&name=${encodeURIComponent(item.name)}`;
    }
    return `/api/recordings/file?name=${encodeURIComponent(item.name)}`;
  };

  const videos = items.filter((i) => i.type === 'video') as Extract<MediaItem, { type: 'video' }>[];
  const photos = items.filter((i) => i.type === 'photo') as Extract<MediaItem, { type: 'photo' }>[];

  // Group videos by session
  const videoSessions = videos.reduce<Record<string, typeof videos>>((acc, r) => {
    const m = r.name.match(/^(?:rec-)?(.+?)[-_](?:cam|screen)/);
    const key = m ? m[1] : r.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Group photos by session folder
  const photoSessions = photos.reduce<Record<string, typeof photos>>((acc, r) => {
    if (!acc[r.session]) acc[r.session] = [];
    acc[r.session].push(r);
    return acc;
  }, {});

  const totalCount = items.length;

  return (
    <div style={{
      width: 300, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(4,8,18,0.98)',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',   // critical — prevents panel from expanding
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            Archivos · {totalCount}
          </p>
          <button
            onClick={deleteAll}
            disabled={deleting || totalCount === 0}
            style={{
              fontSize: 10, padding: '3px 10px',
              background: totalCount > 0 ? 'rgba(200,40,60,0.2)' : 'transparent',
              border: `1px solid ${totalCount > 0 ? 'rgba(200,40,60,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8, color: totalCount > 0 ? '#f08090' : 'rgba(255,255,255,0.2)',
              cursor: totalCount > 0 ? 'pointer' : 'default',
              fontFamily: 'monospace',
            }}
          >
            {deleting ? '…' : '🗑 Borrar todo'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['video', 'photo'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '5px 0', fontSize: 11,
              background: tab === t ? 'rgba(175,55,78,0.3)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tab === t ? 'rgba(175,55,78,0.5)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 6, color: tab === t ? '#f8c0c8' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontFamily: 'monospace',
            }}>
              {t === 'video' ? `📹 Videos (${videos.length})` : `📸 Fotos (${photos.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#000' }}
          >
            {active.type === 'video' ? (
              <video key={srcFor(active)} src={srcFor(active)} controls autoPlay style={{ width: '100%', display: 'block', maxHeight: 180 }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={srcFor(active)} alt={active.name} style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'contain', background: '#000' }} />
            )}
            <div style={{ padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1, marginRight: 8 }}>
                {active.name}
              </span>
              <button onClick={() => setActive(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
        {loading && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 20 }}>Cargando…</p>}

        {!loading && tab === 'video' && Object.keys(videoSessions).length === 0 && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 20, fontStyle: 'italic' }}>Sin videos todavía</p>
        )}

        {!loading && tab === 'photo' && Object.keys(photoSessions).length === 0 && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 20, fontStyle: 'italic' }}>Sin fotos todavía</p>
        )}

        {/* Videos grouped by session */}
        {tab === 'video' && Object.entries(videoSessions).map(([sessionId, recs]) => (
          <div key={sessionId} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '5px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', margin: 0 }}>{fmtDate(recs[0].mtime)}</p>
            </div>
            {recs.map((r) => {
              const isCam = r.name.includes('-cam') || r.name.includes('_cam');
              const isActive = active?.type === 'video' && active.name === r.name;
              return (
                <button key={r.name} onClick={() => setActive(r)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px',
                  background: isActive ? 'rgba(175,55,78,0.2)' : 'transparent',
                  border: 'none', borderTop: '1px solid rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.75)', cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: 14 }}>{isCam ? '📷' : '🖥'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 11, margin: 0, fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>{isCam ? 'Cámara' : 'Pantalla'}</p>
                    <p style={{ fontSize: 9, margin: 0, color: 'rgba(255,255,255,0.3)' }}>{fmt(r.size)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        {/* Photos grouped by session */}
        {tab === 'photo' && Object.entries(photoSessions).map(([sessionId, imgs]) => (
          <div key={sessionId} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '5px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', margin: 0 }}>{fmtDate(imgs[0].mtime)}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 4 }}>
              {imgs.map((img) => {
                const isActive = active?.type === 'photo' && active.name === img.name && active.session === img.session;
                return (
                  <button key={img.name} onClick={() => setActive(img)} style={{
                    padding: 0, border: isActive ? '2px solid rgba(175,55,78,0.8)' : '2px solid transparent',
                    borderRadius: 4, overflow: 'hidden', cursor: 'pointer', background: '#111', aspectRatio: '1',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={srcFor(img)} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin inner panel ────────────────────────────────────────────────────────
function AdminInner() {
  const room = useRoomContext();
  const participants = useParticipants();
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [hearBirthday, setHearBirthday] = useState(true); // whether caller hears birthday girl
  const [showMedia, setShowMedia] = useState(false);

  const camTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  const birthdayCam = camTracks.find((t) => t.participant.identity.startsWith('birthday'));
  const birthdayScreen = screenTracks.find((t) => t.participant.identity.startsWith('birthday'));
  const myCam = camTracks.find((t) => t.participant.isLocal);

  const birthdayConnected = participants.some((p) => p.identity.startsWith('birthday'));
  const spectators = participants.filter((p) => p.identity.startsWith('espectador'));
  const mainTrack = birthdayScreen ?? birthdayCam ?? null;
  const [rightTab, setRightTab] = useState<'spectators' | 'chat'>('spectators');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const spectatorCamTracks = useTracks([Track.Source.Camera], { onlySubscribed: false })
    .filter((t) => t.participant.identity.startsWith('espectador'));

  useEffect(() => {
    room.localParticipant.setCameraEnabled(true).catch(() => {});
    room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    await room.localParticipant.setMicrophoneEnabled(next).catch(() => {});
    setMicOn(next);
  }, [micOn, room]);

  const toggleCam = useCallback(async () => {
    const next = !camOn;
    await room.localParticipant.setCameraEnabled(next).catch(() => {});
    setCamOn(next);
  }, [camOn, room]);

  // Mute/unmute birthday girl's audio LOCALLY (only the caller is affected)
  const toggleHearBirthday = useCallback(() => {
    const next = !hearBirthday;
    const birthdayP = participants.find((p) => p.identity.startsWith('birthday'));
    if (birthdayP) {
      birthdayP.audioTrackPublications.forEach((pub) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (pub.track as any)?.setVolume?.(next ? 1 : 0);
      });
    }
    setHearBirthday(next);
  }, [hearBirthday, participants]);

  const [txPaused, setTxPaused] = useState(false);
  const toggleTx = useCallback(() => {
    const next = !txPaused;
    setTxPaused(next);
    if (next) {
      room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
      room.localParticipant.setCameraEnabled(false).catch(() => {});
    } else {
      room.localParticipant.setMicrophoneEnabled(micOn).catch(() => {});
      room.localParticipant.setCameraEnabled(camOn).catch(() => {});
    }
  }, [txPaused, room, micOn, camOn]);

  // Chat — receive from all participants
  useEffect(() => {
    const decoder = new TextDecoder();
    const handler = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(decoder.decode(payload)) as ChatMsg;
        if (msg.id) setMessages((prev) => [...prev, msg]);
      } catch { /* ignore */ }
    };
    room.on(RoomEvent.DataReceived, handler);
    return () => { room.off(RoomEvent.DataReceived, handler); };
  }, [room]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    const msg: ChatMsg = {
      id: `${Date.now()}-${Math.random()}`,
      sender: 'Caller',
      text,
      time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
    const encoder = new TextEncoder();
    room.localParticipant.publishData(encoder.encode(JSON.stringify(msg)), { reliable: true }).catch(() => {});
    setChatInput('');
  }, [chatInput, room]);

  return (
    <div style={{ height: '100vh', background: '#060b14', display: 'flex', flexDirection: 'column', fontFamily: 'monospace', color: '#e8d0d8', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.5)', flexShrink: 0 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.25)' }}>Panel llamada</span>
        <div style={{ flex: 1 }} />
        {/* Birthday status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: birthdayConnected ? 'rgba(60,200,100,0.1)' : 'rgba(200,60,60,0.1)', border: `1px solid ${birthdayConnected ? 'rgba(60,200,100,0.25)' : 'rgba(200,60,60,0.2)'}` }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: birthdayConnected ? '#3dc878' : '#c84040', boxShadow: birthdayConnected ? '0 0 6px #3dc878' : 'none' }} />
          <span style={{ fontSize: 10, color: birthdayConnected ? '#9fe8c0' : '#e89090' }}>{birthdayConnected ? 'Cumpleañera en línea' : 'Esperando…'}</span>
        </div>
        {/* Mic badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: micOn ? 'rgba(60,200,100,0.12)' : 'rgba(200,60,60,0.12)', border: `1px solid ${micOn ? 'rgba(60,200,100,0.25)' : 'rgba(200,60,60,0.2)'}`, borderRadius: 20, fontSize: 10, color: micOn ? '#9fe8c0' : '#e89090' }}>
          {micOn ? '🎙 Activo' : '🔇 Silenciado'}
        </div>
        {/* Media toggle */}
        <button onClick={() => setShowMedia(!showMedia)} style={{ padding: '4px 12px', background: showMedia ? 'rgba(175,55,78,0.3)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showMedia ? 'rgba(175,55,78,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: showMedia ? '#f8c0c8' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 10, fontFamily: 'monospace' }}>
          📁 Archivos
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Main: birthday view ── */}
        <div style={{ flex: 1, position: 'relative', background: '#020508', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {mainTrack ? (
              <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0 }}>
                <VideoTrack trackRef={mainTrack} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                {birthdayScreen && (
                  <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 10, color: 'rgba(180,220,255,0.8)', background: 'rgba(0,0,0,0.6)', borderRadius: 5, padding: '2px 8px' }}>🖥 Pantalla</div>
                )}
              </motion.div>
            ) : (
              <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: 48 }}>🎂</motion.div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{birthdayConnected ? 'Sin cámara' : 'Esperando que ella abra la app…'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right column: own cam + spectators + controls ── */}
        <div style={{ width: 240, flexShrink: 0, background: 'rgba(4,8,18,0.98)', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Own camera */}
          <div style={{ flexShrink: 0, padding: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)', margin: '0 0 6px' }}>Tu cámara</p>
            <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000', aspectRatio: '16/9', position: 'relative' }}>
              {myCam && camOn ? (
                <VideoTrack trackRef={myCam} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, opacity: 0.3 }}>📷</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ flexShrink: 0, padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Row 1: mic + cam + end */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={toggleMic} style={{ flex: 1, padding: '8px 0', background: micOn ? 'rgba(60,200,100,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${micOn ? 'rgba(60,200,100,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: micOn ? '#9fe8c0' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }} title={micOn ? 'Silenciar mi mic' : 'Activar mi mic'}>
                {micOn ? '🎙' : '🔇'}
              </button>
              <button onClick={toggleCam} style={{ flex: 1, padding: '8px 0', background: camOn ? 'rgba(60,140,255,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${camOn ? 'rgba(60,140,255,0.25)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: camOn ? '#90c8f8' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }} title={camOn ? 'Apagar cámara' : 'Encender cámara'}>
                {camOn ? '📹' : '📷'}
              </button>
              <button onClick={toggleTx} style={{ flex: 1, padding: '8px 0', background: txPaused ? 'rgba(255,160,30,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${txPaused ? 'rgba(255,180,40,0.45)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: txPaused ? '#ffc060' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18 }} title={txPaused ? 'Reanudar transmisión' : 'Pausar transmisión'}>
                {txPaused ? '▶' : '⏸'}
              </button>
            </div>
            {/* Row 2: hear birthday girl toggle */}
            <button onClick={toggleHearBirthday} style={{ width: '100%', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, background: hearBirthday ? 'rgba(212,168,64,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hearBirthday ? 'rgba(212,168,64,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, color: hearBirthday ? '#f0d070' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}>
              <span style={{ fontSize: 16 }}>{hearBirthday ? '👂' : '🙉'}</span>
              <span>{hearBirthday ? 'Escuchando a cumpleañera' : 'Cumpleañera silenciada (solo tú)'}</span>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ flexShrink: 0, display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['spectators', 'chat'] as const).map((t) => (
              <button key={t} onClick={() => setRightTab(t)} style={{
                flex: 1, padding: '7px 0', fontSize: 10,
                background: rightTab === t ? 'rgba(175,55,78,0.2)' : 'transparent',
                border: 'none', borderBottom: rightTab === t ? '2px solid rgba(175,55,78,0.7)' : '2px solid transparent',
                color: rightTab === t ? '#f8c0c8' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer', fontFamily: 'monospace',
              }}>
                {t === 'spectators' ? `👥 ${spectators.length}` : `💬 ${messages.length}`}
              </button>
            ))}
          </div>

          {/* Spectators tab */}
          {rightTab === 'spectators' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {spectators.length === 0 ? (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', margin: 0 }}>Ninguno conectado</p>
              ) : spectators.map((p) => {
                const camTrack = spectatorCamTracks.find((t) => t.participant.identity === p.identity);
                const name = p.identity.replace(/^espectador-/, '');
                return (
                  <div key={p.identity} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    {camTrack ? (
                      <div style={{ aspectRatio: '16/9', background: '#000' }}>
                        <VideoTrack trackRef={camTrack} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ aspectRatio: '16/9', background: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 20, opacity: 0.25 }}>📷</span>
                      </div>
                    )}
                    <div style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3dc878', boxShadow: '0 0 5px #3dc878', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chat tab */}
          {rightTab === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {messages.length === 0 && (
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', textAlign: 'center', marginTop: 16 }}>Sin mensajes</p>
                )}
                {messages.map((msg) => {
                  const isMe = msg.sender === 'Caller';
                  return (
                    <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                      <p style={{ fontSize: 9, color: isMe ? 'rgba(215,95,115,0.7)' : 'rgba(212,168,64,0.7)', margin: '0 0 2px 2px', textAlign: isMe ? 'right' : 'left' }}>{isMe ? 'Yo' : msg.sender}</p>
                      <div style={{ background: isMe ? 'rgba(175,55,78,0.7)' : 'rgba(255,255,255,0.08)', borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px', padding: '7px 10px' }}>
                        <p style={{ fontSize: 12, color: '#fff', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>{msg.text}</p>
                      </div>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', margin: '2px 2px 0', textAlign: isMe ? 'right' : 'left' }}>{msg.time}</p>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>
              <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6, flexShrink: 0 }}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  placeholder="Mensaje..."
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 10px', color: '#fff', fontSize: 12, outline: 'none', fontFamily: 'monospace' }}
                />
                <button onClick={sendChat} disabled={!chatInput.trim()} style={{ padding: '7px 10px', background: chatInput.trim() ? 'rgba(175,55,78,0.8)' : 'rgba(60,30,40,0.4)', border: 'none', borderRadius: 8, color: '#fff', cursor: chatInput.trim() ? 'pointer' : 'default', fontSize: 14 }}>➤</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Media panel (toggle) ── */}
        <AnimatePresence>
          {showMedia && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} style={{ overflow: 'hidden', flexShrink: 0 }}>
              <MediaPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function CallerPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connect = useCallback(() => {
    setLoading(true);
    fetch('/api/livekit-token?role=caller')
      .then((r) => { if (!r.ok) throw new Error('No se pudo conectar'); return r.json(); })
      .then((d) => { setToken(d.token); setServerUrl(d.url); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUnlock = () => {
    setUnlocked(true);
    connect();
  };

  if (!unlocked) return <CodeGate onUnlock={handleUnlock} />;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.6 }} style={{ fontSize: 36, color: 'rgba(232,69,90,0.7)' }}>●</motion.div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div style={{ minHeight: '100vh', background: '#060b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(232,69,90,0.8)', fontFamily: 'monospace' }}>{error ?? 'Error de conexión'}</p>
      </div>
    );
  }

  return (
    <LiveKitRoom token={token} serverUrl={serverUrl} connect video={true} audio={true}>
      <AdminInner />
    </LiveKitRoom>
  );
}
