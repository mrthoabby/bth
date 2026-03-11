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

// ─── Admin inner panel ────────────────────────────────────────────────────────
function AdminInner() {
  const room = useRoomContext();
  const participants = useParticipants();
  const [micOn, setMicOn] = useState(false);   // mic off by default
  const [camOn, setCamOn] = useState(true);
  const [connected, setConnected] = useState(false);

  const camTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  const birthdayCam = camTracks.find((t) => t.participant.identity.startsWith('birthday'));
  const birthdayScreen = screenTracks.find((t) => t.participant.identity.startsWith('birthday'));
  const myCam = camTracks.find((t) => t.participant.isLocal);

  const birthdayParticipant = participants.find((p) => p.identity.startsWith('birthday'));
  const birthdayConnected = !!birthdayParticipant;

  // Init: cam on, mic off
  useEffect(() => {
    room.localParticipant.setCameraEnabled(true).catch(() => {});
    room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
    setConnected(true);
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

  const endCall = useCallback(() => {
    room.disconnect();
  }, [room]);

  // Main content: birthday screen or birthday cam
  const mainTrack = birthdayScreen ?? birthdayCam ?? null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060b14',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'monospace',
      color: '#e8d0d8',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)' }}>
          Panel de llamada
        </span>
        <div style={{ flex: 1 }} />

        {/* Birthday status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          borderRadius: 20,
          background: birthdayConnected ? 'rgba(60,200,100,0.12)' : 'rgba(200,60,60,0.12)',
          border: `1px solid ${birthdayConnected ? 'rgba(60,200,100,0.3)' : 'rgba(200,60,60,0.25)'}`,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: birthdayConnected ? '#3dc878' : '#c84040',
            boxShadow: birthdayConnected ? '0 0 8px #3dc878' : 'none',
          }} />
          <span style={{ fontSize: 11, color: birthdayConnected ? '#9fe8c0' : '#e89090' }}>
            {birthdayConnected ? 'Cumpleañera conectada' : 'Esperando cumpleañera…'}
          </span>
        </div>

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
          {participants.length} en sala
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', gap: 0, minHeight: 0 }}>

        {/* ── Main view: birthday screen/cam ── */}
        <div style={{ flex: 1, position: 'relative', background: '#030609', minHeight: 0 }}>
          <AnimatePresence mode="wait">
            {mainTrack ? (
              <motion.div
                key="birthday-feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
              >
                <VideoTrack
                  trackRef={mainTrack}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                {birthdayScreen && (
                  <div style={{
                    position: 'absolute', top: 10, left: 12,
                    fontSize: 10, color: 'rgba(180,220,255,0.8)',
                    background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 8px',
                  }}>
                    🖥 Pantalla de la cumpleañera
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 14,
                }}
              >
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ fontSize: 52 }}
                >
                  🎂
                </motion.div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                  {birthdayConnected ? 'Cámara de cumpleañera no disponible' : 'Esperando que ella abra la app…'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* My camera PiP */}
          {myCam && camOn && (
            <div style={{
              position: 'absolute', bottom: 16, right: 16,
              width: 160, height: 112,
              borderRadius: 10, overflow: 'hidden',
              border: '1.5px solid rgba(215,95,115,0.5)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
              zIndex: 10,
            }}>
              <VideoTrack
                trackRef={myCam}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                fontSize: 9, color: 'rgba(255,255,255,0.8)',
                background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '1px 7px',
                whiteSpace: 'nowrap',
              }}>
                Tú
              </div>
            </div>
          )}

          {/* Mic status badge */}
          <div style={{
            position: 'absolute', top: 10, right: 12,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            background: micOn ? 'rgba(60,200,100,0.15)' : 'rgba(200,60,60,0.15)',
            border: `1px solid ${micOn ? 'rgba(60,200,100,0.3)' : 'rgba(200,60,60,0.25)'}`,
            borderRadius: 20, fontSize: 11,
            color: micOn ? '#9fe8c0' : '#e89090',
          }}>
            {micOn ? '🎙 Micrófono activo' : '🔇 Micrófono silenciado'}
          </div>
        </div>

        {/* ── Right sidebar: controls ── */}
        <div style={{
          width: 220, flexShrink: 0,
          background: 'rgba(4,8,18,0.98)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          padding: '20px 14px', gap: 12,
        }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.25)', margin: 0, marginBottom: 4 }}>
            Controles
          </p>

          {/* Mic toggle */}
          <button
            onClick={toggleMic}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px',
              background: micOn ? 'rgba(60,200,100,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${micOn ? 'rgba(60,200,100,0.35)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, color: micOn ? '#9fe8c0' : 'rgba(255,255,255,0.65)',
              cursor: 'pointer', fontSize: 13, textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 18 }}>{micOn ? '🎙' : '🔇'}</span>
            <span>{micOn ? 'Silenciar mic' : 'Activar mic'}</span>
          </button>

          {/* Cam toggle */}
          <button
            onClick={toggleCam}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px',
              background: camOn ? 'rgba(60,140,255,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${camOn ? 'rgba(60,140,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, color: camOn ? '#90c8f8' : 'rgba(255,255,255,0.65)',
              cursor: 'pointer', fontSize: 13, textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 18 }}>{camOn ? '📹' : '📷'}</span>
            <span>{camOn ? 'Apagar cámara' : 'Encender cámara'}</span>
          </button>

          <div style={{ flex: 1 }} />

          {/* Birthday mic indicator */}
          <div style={{
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
          }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Cumpleañera
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: birthdayConnected ? '#3dc878' : 'rgba(255,255,255,0.2)',
                boxShadow: birthdayConnected ? '0 0 6px #3dc878' : 'none',
              }} />
              <span style={{ fontSize: 12, color: birthdayConnected ? '#9fe8c0' : 'rgba(255,255,255,0.3)' }}>
                {birthdayConnected ? 'En línea' : 'Desconectada'}
              </span>
            </div>
          </div>

          {/* End call */}
          <button
            onClick={endCall}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 14px',
              background: 'rgba(200,40,60,0.2)',
              border: '1px solid rgba(200,40,60,0.4)',
              borderRadius: 10, color: '#f08090',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            ✕ Terminar llamada
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function CallerPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/livekit-token?role=caller')
      .then((r) => { if (!r.ok) throw new Error('No se pudo conectar'); return r.json(); })
      .then((d) => { setToken(d.token); setServerUrl(d.url); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          style={{ fontSize: 40, color: 'rgba(232,69,90,0.7)' }}
        >
          ●
        </motion.div>
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
    <LiveKitRoom token={token} serverUrl={serverUrl} connect video={true} audio={false}>
      <AdminInner />
    </LiveKitRoom>
  );
}
