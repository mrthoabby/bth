'use client';
import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { loadConfig, BirthdayConfig, StopConfig } from '@/lib/config';
import { useRecording } from '@/hooks/useRecording';

import RosePetals from '@/components/RosePetals';
import WelcomeScreen from '@/components/WelcomeScreen';
import BirthdayScene from '@/components/BirthdayScene';
import MapView from '@/components/MapView';
import FinalScreen from '@/components/FinalScreen';

const SurpriseCall = dynamic(() => import('@/components/SurpriseCall'), { ssr: false });
const PhotoSession = dynamic(() => import('@/components/PhotoSession'), { ssr: false });

type Phase = 'welcome' | 'birthday-scene' | 'photo-session' | 'map' | 'surprise-call' | 'final';

export default function Home() {
  const [config, setConfig] = useState<BirthdayConfig | null>(null);
  const [phase, setPhase] = useState<Phase>('welcome');

  // Stops state
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [solvedChallengeIds, setSolvedChallengeIds] = useState<Set<string>>(new Set());
  const [viewedMediaIds, setViewedMediaIds] = useState<Set<string>>(new Set());
  const [hangingPhotos, setHangingPhotos] = useState<string[]>([]);

  const { state: recordingState, start: startRecording, stop: stopRecording } = useRecording();

  useEffect(() => {
    loadConfig().then(setConfig).catch(console.error);
  }, []);

  const handleStart = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  const handlePhotoCaptured = useCallback((photoDataUrl: string) => {
    setHangingPhotos((prev) => [...prev, photoDataUrl]);
  }, []);

  const handleSelectStop = useCallback((stop: StopConfig) => {
    setSelectedStopId((prev) => (prev === stop.id ? null : stop.id));
  }, []);

  const handleChallengeSolved = useCallback((challengeId: string) => {
    setSolvedChallengeIds((prev) => new Set([...prev, challengeId]));
  }, []);

  const handleMediaViewed = useCallback((challengeId: string) => {
    setViewedMediaIds((prev) => new Set([...prev, challengeId]));
  }, []);

  const allCompleted = config
    ? config.stops.every((stop) => stop.challenges.every((c) => viewedMediaIds.has(c.id)))
    : false;

  if (!config) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} style={{ fontSize: 40 }}>
          🌹
        </motion.div>
      </div>
    );
  }

  return (
    <main className="romantic-bg" style={{ position: 'relative', minHeight: '100vh' }}>
      <RosePetals count={12} />


      {hangingPhotos.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            left: 14,
            zIndex: 9999,
            width: 164,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              height: 2,
              width: 148,
              margin: '0 auto 8px',
              background: 'linear-gradient(90deg, rgba(95, 48, 57, 0.45), rgba(158, 86, 100, 0.45))',
              borderRadius: 999,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hangingPhotos.map((photo, i) => (
              <div key={`${photo.slice(0, 24)}-${i}`} style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 1, height: 14, background: 'rgba(95, 48, 57, 0.45)' }} />
                <div
                  style={{
                    marginTop: 14,
                    marginLeft: -1,
                    background: '#fff',
                    border: '1px solid rgba(95, 48, 57, 0.25)',
                    borderRadius: 6,
                    padding: '4px 4px 10px',
                    boxShadow: '0 4px 12px rgba(44, 36, 40, 0.2)',
                    transform: `rotate(${i % 2 === 0 ? -4 : 3}deg)`,
                    width: 108,
                  }}
                >
                  <img
                    src={photo}
                    alt={`Foto recuerdo ${i + 1}`}
                    style={{ width: '100%', height: 78, objectFit: 'cover', borderRadius: 4, display: 'block', transform: 'scaleX(-1)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WelcomeScreen
              riddle={config.intro}
              recordingState={recordingState}
              onStart={handleStart}
              onSolved={() => setPhase('birthday-scene')}
            />
          </motion.div>
        )}


        {phase === 'birthday-scene' && (
          <motion.div key="birthday-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BirthdayScene
              music={config.birthdayScene.music}
              message={config.birthdayScene.message}
              subMessage={config.birthdayScene.subMessage}
              onContinue={() => setPhase('photo-session')}
            />
          </motion.div>
        )}

        {phase === 'photo-session' && (
          <motion.div key="photo-session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PhotoSession
              title={config.photoSession.title}
              subtitle={config.photoSession.subtitle}
              totalPhotos={config.photoSession.totalPhotos}
              onPhotoCaptured={handlePhotoCaptured}
              onContinue={() => setPhase('map')}
            />
          </motion.div>
        )}

        {phase === 'map' && (
          <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100vh' }}>
            <MapView
              stops={config.stops}
              solvedChallengeIds={solvedChallengeIds}
              viewedMediaIds={viewedMediaIds}
              selectedStopId={selectedStopId}
              allCompleted={allCompleted}
              onSelectStop={handleSelectStop}
              onChallengeSolved={handleChallengeSolved}
              onMediaViewed={handleMediaViewed}
              onFinalClick={() => setPhase('surprise-call')}
              finalTitle={config.final.title}
              finalEmoji={config.final.emoji}
            />
          </motion.div>
        )}

        {phase === 'surprise-call' && (
          <motion.div key="surprise-call" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SurpriseCall onCallEnded={() => setPhase('final')} />
          </motion.div>
        )}

        {phase === 'final' && (
          <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FinalScreen
              message={config.final.finalMessage}
              subMessage={config.final.finalSubMessage}
              recordingState={recordingState}
              onStopRecording={stopRecording}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
