'use client';
import { useEffect, useState, useCallback } from 'react';
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

// ─── Waiting screen with "call now" button ───────────────────────────────────
function WaitingScreen({ onEnd }: { onEnd: () => void }) {
  const [ringing, setRinging] = useState(false);
  const [busy, setBusy] = useState(false);

  const ring = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/ring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ring' }),
      });
      setRinging(true);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const cancel = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/ring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      setRinging(false);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen text-center p-6 gap-8"
    >
      <motion.div
        animate={{ scale: ringing ? [1, 1.12, 1] : [1, 1.06, 1], rotate: ringing ? [0, -8, 8, -6, 6, 0] : [0, 3, -3, 0] }}
        transition={{ repeat: Infinity, duration: ringing ? 1.2 : 3 }}
        className="text-8xl"
      >
        {ringing ? '📞' : '🕐'}
      </motion.div>

      <div>
        <h1 className="text-3xl md:text-4xl font-bold glow-text mb-3" style={{ color: 'var(--rose-light)' }}>
          {ringing ? 'Llamando...' : 'Panel del caller'}
        </h1>
        <p className="text-rose-300 opacity-70 text-lg">
          {ringing
            ? 'Esperando que ella conteste ✨'
            : 'Llama cuando quieras o espera a que llegue a Inglaterra 🏰'}
        </p>
      </div>

      {!ringing ? (
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          onClick={ring}
          disabled={busy}
          style={{
            padding: '16px 40px',
            background: 'linear-gradient(135deg, rgba(175,55,78,0.92), rgba(135,38,58,0.92))',
            border: '1.5px solid rgba(215,95,115,0.65)',
            borderRadius: 16,
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(175,55,78,0.45)',
          }}
        >
          📞 Llamar ahora
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={cancel}
          disabled={busy}
          style={{
            padding: '12px 28px',
            background: 'rgba(60,30,40,0.75)',
            border: '1.5px solid rgba(215,95,115,0.35)',
            borderRadius: 12,
            color: 'rgba(255,160,170,0.85)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cancelar llamada
        </motion.button>
      )}

      <motion.div
        className="flex gap-3 text-3xl"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {'❤️🌹💕'.split('').map((e, i) => <span key={i}>{e}</span>)}
      </motion.div>
    </motion.div>
  );
}

// ─── Active call — 3-panel layout ────────────────────────────────────────────
function ActiveCall({ onEnd }: { onEnd: () => void }) {
  const room = useRoomContext();

  const camTracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const screenTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });

  const remoteCam = camTracks.filter((t) => !t.participant.isLocal);
  const localCam = camTracks.filter((t) => t.participant.isLocal);
  const remoteScreen = screenTracks.filter((t) => !t.participant.isLocal);

  const handleEnd = useCallback(async () => {
    // Cancel ring signal before ending
    await fetch('/api/ring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    }).catch(() => {});
    room.disconnect();
    onEnd();
  }, [room, onEnd]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glow-text text-center"
        style={{ color: 'var(--rose-light)', fontSize: 20, fontWeight: 700, flexShrink: 0 }}
      >
        🎉 ¡Están conectados!
      </motion.h2>

      {/* Main panels */}
      <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0 }}>

        {/* Screen share — large left panel */}
        <div style={{
          flex: '1 1 60%', borderRadius: 16, overflow: 'hidden', background: '#070310',
          border: '1.5px solid rgba(100,100,255,0.35)',
          boxShadow: '0 0 30px rgba(80,80,255,0.2)',
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 320,
        }}>
          {remoteScreen[0] ? (
            <VideoTrack
              trackRef={remoteScreen[0]}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ color: 'rgba(150,150,255,0.6)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🖥️</div>
              Pantalla compartida<br />
              <span style={{ opacity: 0.55, fontSize: 11 }}>esperando pantalla de ella...</span>
            </div>
          )}
          <div style={{
            position: 'absolute', top: 8, left: 10,
            fontSize: 10, color: 'rgba(180,180,255,0.65)',
            background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 6px',
          }}>
            Pantalla compartida
          </div>
        </div>

        {/* Remote camera — right panel */}
        <div style={{
          flex: '0 0 36%', borderRadius: 16, overflow: 'hidden', background: '#0d0508',
          border: '1.5px solid rgba(232,69,90,0.45)',
          boxShadow: '0 0 30px rgba(232,69,90,0.25)',
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 280,
        }}>
          {remoteCam[0] ? (
            <VideoTrack
              trackRef={remoteCam[0]}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ color: 'rgba(232,69,90,0.55)', fontSize: 13, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📹</div>
              Cámara de ella
            </div>
          )}
          <div style={{
            position: 'absolute', top: 8, left: 10,
            fontSize: 10, color: 'rgba(255,160,170,0.7)',
            background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '2px 6px',
          }}>
            Su cámara
          </div>
        </div>
      </div>

      {/* Local camera PiP */}
      <div style={{
        position: 'fixed', bottom: 90, right: 16,
        width: 120, height: 90, borderRadius: 10, overflow: 'hidden',
        border: '2px solid var(--rose)', zIndex: 10,
        background: '#000',
      }}>
        {localCam[0] && (
          <VideoTrack
            trackRef={localCam[0]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div style={{
          position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
          fontSize: 9, color: 'rgba(255,255,255,0.55)',
          background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap',
        }}>
          Yo
        </div>
      </div>

      {/* End call */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleEnd}
        style={{
          alignSelf: 'center', padding: '13px 36px',
          background: 'linear-gradient(135deg, #8b0000, #c0202f)',
          border: 'none', borderRadius: 14, color: '#fff',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(192,32,47,0.5)',
          flexShrink: 0,
        }}
      >
        Finalizar momento ❤️
      </motion.button>
    </motion.div>
  );
}

// ─── Room inner (switches waiting ↔ active) ──────────────────────────────────
function RoomInner({ onEnd }: { onEnd: () => void }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const hasRemote = participants.filter((p) => !p.isLocal).length > 0;

  useEffect(() => {
    const handler = () => onEnd();
    room.on(RoomEvent.Disconnected, handler);
    return () => { room.off(RoomEvent.Disconnected, handler); };
  }, [room, onEnd]);

  return hasRemote ? <ActiveCall onEnd={onEnd} /> : <WaitingScreen onEnd={onEnd} />;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function IncomingCallPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    async function getToken() {
      try {
        const res = await fetch('/api/livekit-token?role=caller');
        if (!res.ok) throw new Error('No se pudo obtener el token');
        const data = await res.json();
        setToken(data.token);
        setServerUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      }
    }
    getToken();
  }, []);

  if (ended) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <div className="text-7xl mb-6">✅</div>
        <h2 className="text-3xl font-bold glow-text mb-4" style={{ color: 'var(--rose-light)' }}>
          Momento finalizado
        </h2>
        <p className="text-rose-300 opacity-80">El mensaje final llegará a ella ❤️</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-rose-400">{error}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="text-5xl"
        >
          🌹
        </motion.div>
      </div>
    );
  }

  return (
    <div className="romantic-bg">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        video={true}
        audio={true}
        style={{ minHeight: '100vh' }}
      >
        <RoomInner onEnd={() => setEnded(true)} />
      </LiveKitRoom>
    </div>
  );
}
