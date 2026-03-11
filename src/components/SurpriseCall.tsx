'use client';
import { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  useRoomContext,
  useTracks,
  VideoTrack,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, RoomEvent } from 'livekit-client';

interface Props {
  onCallEnded: () => void;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const FAKE_DURATION = 600; // 10 min fake duration

// Renders inside BackgroundStream's LiveKitRoom — shows caller's camera as a video modal
export default function SurpriseCall({ onCallEnded }: Props) {
  const room = useRoomContext();
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remoteTracks = useTracks([Track.Source.Camera], { onlySubscribed: false })
    .filter((t) => !t.participant.isLocal);

  const hasVideo = remoteTracks.length > 0;

  // Start/stop the fake timer when video appears/disappears
  useEffect(() => {
    if (hasVideo) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hasVideo]);

  const handleEnd = useCallback(() => {
    // Don't disconnect — room stays alive for spectators and caller
    onCallEnded();
  }, [onCallEnded]);

  useEffect(() => {
    room.on(RoomEvent.Disconnected, onCallEnded);
    return () => { room.off(RoomEvent.Disconnected, onCallEnded); };
  }, [room, onCallEnded]);

  const progress = Math.min(elapsed / FAKE_DURATION, 1);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(4,2,10,0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 760,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 8px 60px rgba(0,0,0,0.85), 0 0 0 1.5px rgba(215,95,115,0.25)',
        background: '#050812',
        position: 'relative',
        aspectRatio: '16/9',
      }}>

        {/* Caller's camera — looks like a video */}
        {hasVideo ? (
          <VideoTrack
            trackRef={remoteTracks[0]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          /* Buffering / loading state */
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 20, background: '#050812',
          }}>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              style={{ fontSize: 56 }}
            >
              🌹
            </motion.div>
            {/* Fake loading bar */}
            <div style={{ width: 200, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(232,69,90,0.6)', borderRadius: 99 }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
              Cargando video...
            </p>
          </div>
        )}

        {/* Video player bottom bar — only when video is playing */}
        {hasVideo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.78))',
              padding: '28px 16px 14px',
            }}
          >
            {/* Progress bar */}
            <div
              style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 99, marginBottom: 8, cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ width: `${progress * 100}%`, height: '100%', background: 'rgba(232,69,90,0.9)', borderRadius: 99, transition: 'width 1s linear' }} />
              {/* Thumb dot */}
              <div style={{
                position: 'absolute', top: '50%', left: `${progress * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 10, height: 10, borderRadius: '50%',
                background: '#e8455a',
                boxShadow: '0 0 6px rgba(232,69,90,0.8)',
              }} />
            </div>
            {/* Time row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                {fmtTime(elapsed)} / {fmtTime(FAKE_DURATION)}
              </span>
              {/* Invisible close button — hover reveals it */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                onClick={handleEnd}
                style={{
                  background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6, padding: '4px 12px',
                  color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer',
                }}
              >
                ✕
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Buffering: no bottom bar but keep invisible close accessible */}
        {!hasVideo && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            whileHover={{ opacity: 0.6 }}
            onClick={handleEnd}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '6px 14px',
              color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer',
            }}
          >
            ✕
          </motion.button>
        )}
      </div>
    </div>
  );
}
