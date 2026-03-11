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

function WaitingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen text-center p-6"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-8xl mb-8"
      >
        🕐
      </motion.div>
      <h1
        className="text-3xl md:text-4xl font-bold glow-text mb-4"
        style={{ color: 'var(--rose-light)' }}
      >
        Esperando el momento especial...
      </h1>
      <p className="text-rose-300 opacity-70 text-lg">
        Cuando ella llegue aquí, ¡comenzará la magia! ✨
      </p>
      <motion.div
        className="mt-8 flex gap-3 text-3xl"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {'❤️🌹💕'.split('').map((e, i) => (
          <span key={i}>{e}</span>
        ))}
      </motion.div>
    </motion.div>
  );
}

function ActiveCall({ onEnd }: { onEnd: () => void }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const remoteTracks = tracks.filter((t) => !t.participant.isLocal);
  const localTracks = tracks.filter((t) => t.participant.isLocal);

  const handleEnd = useCallback(() => {
    room.disconnect();
    onEnd();
  }, [room, onEnd]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative flex flex-col items-center justify-center min-h-screen p-4"
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold glow-text mb-6"
        style={{ color: 'var(--rose-light)' }}
      >
        🎉 ¡Ella está aquí!
      </motion.h2>

      {/* Remote (birthday person) video */}
      <div
        className="rounded-2xl overflow-hidden w-full max-w-2xl mb-6"
        style={{
          minHeight: 360,
          background: '#0d0508',
          boxShadow: '0 0 60px rgba(232,69,90,0.4)',
          border: '2px solid rgba(232,69,90,0.5)',
        }}
      >
        {remoteTracks[0] ? (
          <VideoTrack
            trackRef={remoteTracks[0]}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }}
          />
        ) : (
          <div className="flex items-center justify-center h-80 text-rose-400 animate-pulse">
            Conectando cámara...
          </div>
        )}
      </div>

      {/* Local preview */}
      <div
        className="absolute bottom-24 right-6 rounded-xl overflow-hidden"
        style={{ width: 120, height: 90, border: '2px solid var(--rose)', zIndex: 10 }}
      >
        {localTracks[0] && (
          <VideoTrack
            trackRef={localTracks[0]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      <p className="text-rose-300 text-sm mb-6">
        Participantes: {participants.length}
      </p>

      <motion.button
        className="btn-rose px-10 py-4 text-lg"
        onClick={handleEnd}
        whileHover={{ scale: 1.05 }}
        style={{ background: 'linear-gradient(135deg,#8b0000,#c0202f)' }}
      >
        Finalizar momento ❤️
      </motion.button>
    </motion.div>
  );
}

function RoomInner({ onEnd }: { onEnd: () => void }) {
  const room = useRoomContext();
  const participants = useParticipants();
  // Show active call when at least 2 participants (caller + birthday person)
  const hasRemote = participants.filter((p) => !p.isLocal).length > 0;

  useEffect(() => {
    const handler = () => onEnd();
    room.on(RoomEvent.Disconnected, handler);
    return () => { room.off(RoomEvent.Disconnected, handler); };
  }, [room, onEnd]);

  return hasRemote ? <ActiveCall onEnd={onEnd} /> : <WaitingScreen />;
}

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
