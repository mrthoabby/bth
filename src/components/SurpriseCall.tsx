'use client';
import { useEffect, useCallback } from 'react';
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

// Renders inside BackgroundStream's LiveKitRoom — shows caller's camera as a video modal
export default function SurpriseCall({ onCallEnded }: Props) {
  const room = useRoomContext();

  const remoteTracks = useTracks([Track.Source.Camera], { onlySubscribed: false })
    .filter((t) => !t.participant.isLocal);

  const handleEnd = useCallback(() => {
    // Don't disconnect — room stays alive for spectators and caller
    onCallEnded();
  }, [onCallEnded]);

  useEffect(() => {
    room.on(RoomEvent.Disconnected, onCallEnded);
    return () => { room.off(RoomEvent.Disconnected, onCallEnded); };
  }, [room, onCallEnded]);

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
        {remoteTracks[0] ? (
          <VideoTrack
            trackRef={remoteTracks[0]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          /* Buffering state */
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
            <div style={{ width: 200, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(232,69,90,0.6)', borderRadius: 99 }}
              />
            </div>
          </div>
        )}

        {/* Invisible close — hover only, no call language */}
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
      </div>
    </div>
  );
}
