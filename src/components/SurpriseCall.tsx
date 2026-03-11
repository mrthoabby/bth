'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LiveKitRoom,
  VideoConference,
  useRoomContext,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent } from 'livekit-client';

interface Props {
  onCallEnded: () => void;
}

// Inner component that uses LiveKit room context
function CallView({ onCallEnded }: { onCallEnded: () => void }) {
  const room = useRoomContext();
  const [callerConnected, setCallerConnected] = useState(false);

  // Watch for the caller participant (non-local)
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const remoteTracks = tracks.filter((t) => !t.participant.isLocal);

  useEffect(() => {
    if (remoteTracks.length > 0) setCallerConnected(true);
  }, [remoteTracks]);

  const handleEnd = useCallback(() => {
    room.disconnect();
    onCallEnded();
  }, [room, onCallEnded]);

  useEffect(() => {
    room.on(RoomEvent.Disconnected, onCallEnded);
    return () => { room.off(RoomEvent.Disconnected, onCallEnded); };
  }, [room, onCallEnded]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold glow-text mb-4 text-center"
        style={{ color: 'var(--rose-light)' }}
      >
        🎁 Tu último regalo...
      </motion.h2>

      {!callerConnected && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-rose-300 text-center mb-6 animate-pulse"
        >
          Conectando... un momento especial está llegando ✨
        </motion.p>
      )}

      {/* Remote video (the caller) */}
      <div
        className="rounded-2xl overflow-hidden w-full max-w-2xl mb-6"
        style={{
          minHeight: 320,
          background: '#0d0508',
          boxShadow: '0 0 60px rgba(232,69,90,0.3)',
          border: '1px solid rgba(232,69,90,0.4)',
        }}
      >
        {remoteTracks[0] ? (
          <VideoTrack
            trackRef={remoteTracks[0]}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
          />
        ) : (
          <div className="flex items-center justify-center h-80 text-rose-400 text-lg">
            <span className="animate-pulse">Esperando conexión...</span>
          </div>
        )}
      </div>

      {/* Local camera (small) */}
      <div
        className="absolute bottom-24 right-6 rounded-xl overflow-hidden"
        style={{ width: 120, height: 90, border: '2px solid var(--rose)', zIndex: 10 }}
      >
        {tracks
          .filter((t) => t.participant.isLocal)
          .slice(0, 1)
          .map((t) => (
            <VideoTrack
              key={t.publication?.trackSid}
              trackRef={t}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ))}
      </div>

      <motion.button
        className="btn-rose px-8 py-3 mt-4"
        onClick={handleEnd}
        whileHover={{ scale: 1.05 }}
        style={{ background: 'linear-gradient(135deg,#444,#666)' }}
      >
        Terminar llamada
      </motion.button>
    </div>
  );
}

export default function SurpriseCall({ onCallEnded }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    async function connect() {
      try {
        const res = await fetch('/api/livekit-token?role=birthday');
        if (!res.ok) throw new Error('No se pudo obtener el token');
        const data = await res.json();
        setToken(data.token);
        setServerUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión');
      } finally {
        setConnecting(false);
      }
    }
    connect();
  }, []);

  if (connecting) {
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

  if (error || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-rose-400 text-lg">{error || 'Error al conectar'}</p>
        <p className="text-rose-300 text-sm opacity-70">
          Asegúrate de configurar las variables de entorno de LiveKit.
        </p>
        <button className="btn-rose" onClick={onCallEnded}>
          Continuar de todas formas
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={true}
      audio={true}
      style={{ minHeight: '100vh' }}
    >
      <CallView onCallEnded={onCallEnded} />
    </LiveKitRoom>
  );
}
