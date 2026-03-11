'use client';
import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { loadConfig, BirthdayConfig, StopConfig } from '@/lib/config';
import { useRecording } from '@/hooks/useRecording';
import { startAmbientMusic } from '@/lib/sounds';

import RosePetals from '@/components/RosePetals';
import WelcomeScreen from '@/components/WelcomeScreen';
import BirthdayScene from '@/components/BirthdayScene';
import MapView from '@/components/MapView';
import RouletteScreen from '@/components/RouletteScreen';

const SurpriseCall = dynamic(() => import('@/components/SurpriseCall'), { ssr: false });
const PhotoSession = dynamic(() => import('@/components/PhotoSession'), { ssr: false });
const BackgroundStream = dynamic(() => import('@/components/BackgroundStream'), { ssr: false });

type Phase = 'welcome' | 'birthday-scene' | 'photo-session' | 'map';
type Overlay = 'none' | 'paris-modal' | 'roulette' | 'surprise-call' | 'final';

export default function Home() {
  const [config, setConfig] = useState<BirthdayConfig | null>(null);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [overlay, setOverlay] = useState<Overlay>('none');

  // Stops state
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [solvedChallengeIds, setSolvedChallengeIds] = useState<Set<string>>(new Set());
  const [viewedMediaIds, setViewedMediaIds] = useState<Set<string>>(new Set());
  const [hangingPhotos, setHangingPhotos] = useState<string[]>([]);

  const [bgToken, setBgToken] = useState<{ token: string; url: string } | null>(null);

  const { state: recordingState, start: startRecording, camStream, screenStream } = useRecording();

  useEffect(() => {
    loadConfig().then((cfg) => {
      setConfig(cfg);
      // DEV: auto-unlock all for testing
      const all = cfg.stops.flatMap((s) => s.challenges.map((c) => c.id));
      setSolvedChallengeIds(new Set(all));
      setViewedMediaIds(new Set(all));
    }).catch(console.error);
  }, []);

  // Start ambient music on the very first user interaction (browser requires gesture)
  useEffect(() => {
    const start = () => { startAmbientMusic(); document.removeEventListener('pointerdown', start); };
    document.addEventListener('pointerdown', start);
    return () => document.removeEventListener('pointerdown', start);
  }, []);

  // Connect birthday person to LiveKit silently from page open
  // so spectators can see her camera throughout the entire experience
  useEffect(() => {
    fetch('/api/livekit-token?role=birthday')
      .then((r) => r.json())
      .then((data) => setBgToken({ token: data.token, url: data.url }))
      .catch(() => {});
  }, []);

  const handleStart = useCallback(async () => {
    // Fetch a fresh token right before connecting so any stale session is replaced
    const freshToken = await fetch('/api/livekit-token?role=birthday')
      .then((r) => r.json())
      .catch(() => null);
    if (freshToken?.token) setBgToken({ token: freshToken.token, url: freshToken.url });
    await startRecording();
  }, [startRecording]);

  const handlePhotoCaptured = useCallback((photoDataUrl: string) => {
    setHangingPhotos((prev) => [...prev, photoDataUrl]);
  }, []);

  const handleSelectStop = useCallback((stop: StopConfig) => {
    setSelectedStopId((prev) => (prev === stop.id ? null : stop.id));
  }, []);

  const handleDeselectStop = useCallback(() => {
    setSelectedStopId(null);
  }, []);

  const handleChallengeSolved = useCallback((challengeId: string) => {
    setSolvedChallengeIds((prev) => new Set([...prev, challengeId]));
  }, []);

  const handleMediaViewed = useCallback((challengeId: string) => {
    setViewedMediaIds((prev) => new Set([...prev, challengeId]));
  }, []);

  const allCompleted = config
    ? config.stops.every((stop) => stop.challenges.every((c) => solvedChallengeIds.has(c.id)))
    : false;


  // ── DEV shortcut: unlock all challenges instantly ──
  const devUnlockAll = useCallback(() => {
    if (!config) return;
    const all = config.stops.flatMap((s) => s.challenges.map((c) => c.id));
    setSolvedChallengeIds(new Set(all));
    setViewedMediaIds(new Set(all));
  }, [config]);

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
            width: 'min(92vw, 860px)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              height: 2,
              width: '100%',
              margin: '0 0 10px 0',
              background: 'linear-gradient(90deg, rgba(95, 48, 57, 0.45), rgba(158, 86, 100, 0.45))',
              borderRadius: 999,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
            {hangingPhotos.map((photo, i) => (
              <div key={`${photo.slice(0, 24)}-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 1, height: 22, background: 'rgba(95, 48, 57, 0.55)' }} />
                <div
                  style={{
                    marginTop: 0,
                    marginLeft: 0,
                    background: '#fff',
                    border: '1px solid rgba(95, 48, 57, 0.25)',
                    borderRadius: 6,
                    padding: '4px 4px 10px',
                    boxShadow: '0 8px 18px rgba(44, 36, 40, 0.24)',
                    transform: `rotate(${i % 2 === 0 ? -7 : 5}deg)`,
                    width: 144,
                  }}
                >
                  <img
                    src={photo}
                    alt={`Foto recuerdo ${i + 1}`}
                    style={{ width: '100%', height: 104, objectFit: 'cover', borderRadius: 4, display: 'block', transform: 'scaleX(-1)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DEV panel — only in development ── */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed', bottom: 12, left: 12, zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: 4,
          background: 'rgba(0,0,0,0.82)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, padding: '8px 10px', backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
            DEV
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
            {([
              ['welcome',        '📖 Bienvenida'],
              ['birthday-scene', '🎂 Portada'],
              ['photo-session',  '📸 Fotos'],
              ['map',            '🗺️ Mapa'],
              ['final',          '🏁 Final'],
            ] as [Phase, string][]).map(([p, label]) => (
              <button
                key={p}
                onClick={() => { setPhase(p); setOverlay('none'); }}
                style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                  background: phase === p ? 'rgba(158,86,100,0.8)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                }}
              >
                {label}
              </button>
            ))}
            {([
              ['paris-modal',   '🔓 Modal'],
              ['roulette',      '🎡 Ruleta'],
              ['surprise-call', '📞 Llamada'],
            ] as [Overlay, string][]).map(([o, label]) => (
              <button
                key={o}
                onClick={() => { setPhase('map'); setOverlay(o); }}
                style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                  background: overlay === o ? 'rgba(86,100,158,0.8)' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={devUnlockAll}
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 4, cursor: 'pointer',
                background: 'rgba(212,168,64,0.25)', border: '1px solid rgba(212,168,64,0.4)',
                color: 'rgba(212,168,64,0.9)', width: '100%',
              }}
            >
              🔓 Desbloquear todo
            </button>
          </div>
        </div>
      )}

      {bgToken && (
        <BackgroundStream
          token={bgToken.token}
          serverUrl={bgToken.url}
          camStream={camStream}
          screenStream={screenStream}
        >
          {overlay === 'surprise-call' && (
            <SurpriseCall onCallEnded={() => setOverlay('final')} />
          )}
        </BackgroundStream>
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
              onDeselectStop={handleDeselectStop}
              onChallengeSolved={handleChallengeSolved}
              onMediaViewed={handleMediaViewed}
              onSurpriseCall={() => setOverlay('surprise-call')}
              onFinalClick={() => setOverlay('paris-modal')}
              onParisClick={() => setOverlay('paris-modal')}
              finalTitle={config.final.title}
              finalEmoji={config.final.emoji}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Overlays (paris-modal / roulette / final) — same modal shell ── */}
      <AnimatePresence>
        {(overlay === 'paris-modal' || overlay === 'roulette' || overlay === 'final') && (
          <motion.div
            key={overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOverlay('none')}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(10,8,20,0.72)',
              backdropFilter: 'blur(6px)',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                width: '100%',
                maxWidth: 480,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 22 }}>
                  {overlay === 'paris-modal' ? '🔓' : overlay === 'roulette' ? '🎰' : '💝'}
                </span>
                <h3 className="serif" style={{ flex: 1, fontSize: 17, color: 'var(--text)', margin: 0 }}>
                  {overlay === 'paris-modal' ? 'Secretos Desbloqueados' : overlay === 'roulette' ? 'Premio Especial' : 'Feliz Cumpleaños'}
                </h3>
                <button onClick={() => setOverlay('none')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: '2px 6px' }}>✕</button>
              </div>

              {/* Body */}
              {overlay === 'paris-modal' && (
                <div style={{ padding: '28px 28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
                  <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
                    Lo lograste. Cada enigma, cada isla, cada historia.
                  </motion.p>
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ width: '100%', padding: '14px 0', borderTop: '1px solid rgba(215,95,115,0.2)', borderBottom: '1px solid rgba(215,95,115,0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Todos los mensajes', 'Todas las islas', 'Todos los enigmas'].map((item) => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text)' }}>
                        <span style={{ color: '#4ecb71', fontSize: 16 }}>✓</span> {item}
                      </div>
                    ))}
                  </motion.div>
                  <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setOverlay('roulette')}
                    style={{ width: '100%', padding: '16px 24px', background: 'linear-gradient(135deg, rgba(175,55,78,0.95), rgba(135,38,58,0.95))', border: '1.5px solid rgba(215,95,115,0.6)', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(175,55,78,0.45)', letterSpacing: '0.03em' }}>
                    🎰 ¡Girar la Ruleta!
                  </motion.button>
                </div>
              )}

              {overlay === 'roulette' && (
                <RouletteScreen onDone={() => setOverlay('final')} />
              )}

              {overlay === 'final' && (
                <div style={{ padding: '36px 28px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 70, delay: 0.15 }} style={{ fontSize: 52 }}>
                    💝
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="serif glow-text"
                    style={{ fontSize: 'clamp(24px,5vw,34px)', fontWeight: 400, color: 'var(--text)', letterSpacing: '-0.01em', margin: 0 }}>
                    Feliz Cumpleaños
                  </motion.h1>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                    style={{ fontSize: 14, color: 'rgba(230,180,195,0.82)', lineHeight: 1.7, margin: 0 }}>
                    {config.final.finalMessage}
                  </motion.p>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    style={{ display: 'flex', gap: 14, fontSize: 18, opacity: 0.5 }}>
                    {['❤','🌹','♡','🌸','❤','♡','🌹'].map((e, i) => (
                      <motion.span key={i} animate={{ y: [0,-7,0], scale: [1,1.1,1] }} transition={{ delay: i * 0.14, repeat: Infinity, duration: 2.2 }}>{e}</motion.span>
                    ))}
                  </motion.div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
