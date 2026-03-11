'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecordingState } from '@/hooks/useRecording';
import { RiddleConfig } from '@/lib/config';

interface Props {
  riddle: RiddleConfig;
  recordingState: RecordingState;
  onStart: () => Promise<void>;
  onSolved: () => void;
}

const normalize = (s: string) =>
  s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Paper page base style
const PAGE_BG = `
  linear-gradient(180deg,
    rgba(200,160,100,0.06) 0%,
    transparent 8%,
    transparent 92%,
    rgba(200,160,100,0.06) 100%
  ),
  repeating-linear-gradient(
    transparent,
    transparent 27px,
    rgba(170,130,80,0.07) 27px,
    rgba(170,130,80,0.07) 28px
  ),
  linear-gradient(160deg, #fef9f0 0%, #faf3e4 40%, #f6ead6 100%)
`;

// Decorative ornament SVG
function Ornament({ color = 'rgba(158,86,100,0.45)', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size * 3.2} height={size * 0.7} viewBox="0 0 96 20" fill="none" style={{ display: 'block' }}>
      <path d="M 0 10 L 30 10" stroke={color} strokeWidth="0.8" />
      <path d="M 66 10 L 96 10" stroke={color} strokeWidth="0.8" />
      <circle cx="48" cy="10" r="4" fill={color} />
      <circle cx="36" cy="10" r="2" fill={color} opacity="0.6" />
      <circle cx="60" cy="10" r="2" fill={color} opacity="0.6" />
      <circle cx="26" cy="10" r="1" fill={color} opacity="0.4" />
      <circle cx="70" cy="10" r="1" fill={color} opacity="0.4" />
    </svg>
  );
}

// Inner border frame for pages
function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      {/* corner ornaments */}
      {(['top-left','top-right','bottom-left','bottom-right'] as const).map((corner) => (
        <svg
          key={corner}
          width={20} height={20}
          viewBox="0 0 20 20"
          style={{
            position: 'absolute',
            top: corner.includes('top') ? 0 : undefined,
            bottom: corner.includes('bottom') ? 0 : undefined,
            left: corner.includes('left') ? 0 : undefined,
            right: corner.includes('right') ? 0 : undefined,
            opacity: 0.4,
            transform: `rotate(${corner === 'top-left' ? 0 : corner === 'top-right' ? 90 : corner === 'bottom-left' ? 270 : 180}deg)`,
          }}
        >
          <path d="M2,2 L2,10 M2,2 L10,2" stroke="rgba(158,86,100,0.9)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      ))}
      {children}
    </div>
  );
}

export default function WelcomeScreen({ riddle, recordingState, onStart, onSolved }: Props) {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [solved, setSolved] = useState(false);
  const [closingBook, setClosingBook] = useState(false);

  const isMultiple = !!(riddle.type === 'multiple' && riddle.options?.length);
  const options = riddle.options ?? [];

  // Detect when recording successfully started
  useEffect(() => {
    if (attempted && !loading && recordingState !== 'error') {
      setStarted(true);
    }
  }, [attempted, loading, recordingState]);

  // Shows when user cancelled the screen share dialog
  const showCancelModal = attempted && !loading && !started && recordingState === 'error';

  const handleStart = async () => {
    setLoading(true);
    setAttempted(true);
    await onStart();
    setLoading(false);
  };

  const checkAnswer = (selected: string) => {
    if (normalize(selected) === normalize(riddle.answer)) {
      setSolved(true);
      if (!started) onStart().catch(() => {});
      setClosingBook(true);
      setTimeout(onSolved, 950);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 500);
      if (hintsShown < riddle.hints.length) setHintsShown((h) => h + 1);
    }
  };

  const handleSubmit = () => { if (!isMultiple) checkAnswer(answer); };

  return (
    /* Library / dark background */
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at center, #2a1a0e 0%, #140c06 60%, #0a0604 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Subtle ambient particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -12, 0], opacity: [0.12, 0.28, 0.12] }}
          transition={{ duration: 4 + i * 0.7, repeat: Infinity, delay: i * 0.6 }}
          style={{
            position: 'absolute',
            left: `${10 + i * 11}%`,
            bottom: `${8 + (i % 4) * 12}%`,
            width: 3, height: 3,
            borderRadius: '50%',
            background: 'rgba(220,170,100,0.4)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* THE BOOK */}
      <motion.div
        initial={{ scaleX: 0.04, opacity: 0.4 }}
        animate={closingBook
          ? { scaleX: 0.04, opacity: 0.3 }
          : { scaleX: 1, opacity: 1 }
        }
        transition={{
          duration: closingBook ? 0.75 : 0.9,
          ease: closingBook
            ? [0.6, 0.04, 0.98, 0.34]
            : [0.22, 0.8, 0.36, 1],
        }}
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: 'min(920px, 96vw)',
          height: 'min(640px, 90vh)',
          transformOrigin: 'center center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 8px 24px rgba(0,0,0,0.6)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* ── LEFT PAGE ── */}
        <div style={{
          flex: 1,
          background: PAGE_BG,
          padding: 'clamp(28px,4vw,52px) clamp(24px,3vw,44px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          position: 'relative',
          boxShadow: 'inset -8px 0 18px rgba(0,0,0,0.07)',
          borderRight: '1px solid rgba(180,140,80,0.15)',
        }}>
          {/* inner margin lines */}
          <div style={{ position: 'absolute', left: 42, top: 0, bottom: 0, width: 1, background: 'rgba(200,150,100,0.12)', pointerEvents: 'none' }} />

          <PageFrame>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>

              {/* Chapter header */}
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(158,86,100,0.6)', marginBottom: 14, fontWeight: 700 }}>
                Capítulo I
              </p>

              {/* Rose */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="heartbeat"
                style={{ fontSize: 32, marginBottom: 14, lineHeight: 1 }}
              >
                🌹
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                  fontFamily: '"Playfair Display", "Georgia", serif',
                  fontSize: 'clamp(26px,3.6vw,40px)',
                  fontWeight: 700,
                  color: '#1a0e08',
                  letterSpacing: '-0.01em',
                  marginBottom: 10,
                  lineHeight: 1.18,
                }}
              >
                Feliz<br />Cumpleaños
              </motion.h1>

              {/* Ornament */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }} style={{ marginBottom: 18 }}>
                <Ornament />
              </motion.div>

              {/* Body text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.95 }}
                style={{
                  fontSize: 14, color: '#3a2418', lineHeight: 1.9, fontWeight: 400,
                  fontStyle: 'italic', marginBottom: 22,
                  fontFamily: '"Georgia", serif',
                }}
              >
                Te preparé algo muy especial para este día. Para guardar este momento necesito acceso a tu cámara y micrófono. Tendrás que resolver acertijos para continuar. y lograr llegar al premio final adelante. queda poco tiempo y a tu lado tu primer acertijo, "Puedes pedir ayuda a una sobrina o hermana"
              </motion.p>

              {/* Permissions list */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.05 }}
                style={{ borderTop: '1px solid rgba(170,120,60,0.2)', borderBottom: '1px solid rgba(170,120,60,0.2)', padding: '12px 0', marginBottom: 20 }}
              >
                {[
                  { label: 'Cámara' },
                  { label: 'Micrófono' },
                  { label: 'Pantalla completa' },
                ].map(({ label }, i) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: i < 2 ? '1px solid rgba(170,120,60,0.1)' : 'none',
                  }}>
                    <span style={{ fontSize: 13, color: '#3a2418', fontFamily: '"Georgia", serif', letterSpacing: '0.02em' }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 15, color: started ? '#9e5664' : 'rgba(158,86,100,0.5)' }}>
                      {started ? '✓' : '◦'}
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              {!started && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}>
                  {recordingState === 'error' && (
                    <p style={{ color: '#9e5664', fontSize: 12, marginBottom: 8, fontStyle: 'italic' }}>
                      Permite el acceso para continuar.
                    </p>
                  )}
                  <button
                    onClick={handleStart}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: 'linear-gradient(135deg, #9e5664, #7a3848)',
                      color: '#fdf5e4',
                      border: 'none',
                      borderRadius: 3,
                      fontSize: 14,
                      fontFamily: '"Georgia", serif',
                      letterSpacing: '0.06em',
                      cursor: loading ? 'default' : 'pointer',
                      boxShadow: '0 4px 16px rgba(100,30,50,0.35)',
                    }}
                  >
                    {loading ? 'Abriendo permisos...' : 'Comenzar mi sorpresa  ♡'}
                  </button>

                </motion.div>
              )}
              {started && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontSize: 12, color: '#9e5664', fontStyle: 'italic', fontFamily: '"Georgia", serif' }}>
                  Permisos concedidos — resuelve el acertijo →
                </motion.p>
              )}
            </motion.div>
          </PageFrame>

          {/* Page number */}
          <p style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'rgba(100,60,30,0.35)', letterSpacing: '0.1em' }}>
            — 1 —
          </p>
        </div>

        {/* ── BOOK SPINE ── */}
        <div style={{
          width: 22,
          background: 'linear-gradient(90deg, #1a0c06 0%, #3d2010 30%, #2a1508 55%, #1a0c06 100%)',
          flexShrink: 0,
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* spine highlight */}
          <div style={{ position: 'absolute', left: 4, top: 0, bottom: 0, width: 1, background: 'rgba(255,200,120,0.08)' }} />
          <div style={{ position: 'absolute', right: 4, top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.3)' }} />
        </div>

        {/* ── RIGHT PAGE ── */}
        <motion.div
          style={{
            flex: 1,
            background: PAGE_BG,
            padding: 'clamp(28px,4vw,52px) clamp(24px,3vw,44px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative',
            boxShadow: 'inset 8px 0 18px rgba(0,0,0,0.07)',
            opacity: started ? 1 : 0.55,
            transition: 'opacity 0.4s ease',
            pointerEvents: started ? 'auto' : 'none',
          }}
        >
          {/* inner margin */}
          <div style={{ position: 'absolute', right: 42, top: 0, bottom: 0, width: 1, background: 'rgba(200,150,100,0.12)', pointerEvents: 'none' }} />

          <PageFrame>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>

              {/* Chapter header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(158,86,100,0.6)', fontWeight: 700 }}>
                  El primer enigma
                </p>
              </div>

              {/* Lock icon */}
              <div style={{ fontSize: 24, marginBottom: 10, opacity: 0.7 }}>🔐</div>

              {/* Riddle */}
              <p style={{
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontSize: 'clamp(14px,1.8vw,18px)',
                color: '#1a0e08',
                lineHeight: 1.8,
                fontStyle: 'italic',
                marginBottom: 20,
                fontWeight: 400,
                borderLeft: '2px solid rgba(158,86,100,0.3)',
                paddingLeft: 14,
              }}>
                &ldquo;{riddle.riddle}&rdquo;
              </p>

              {/* Hints */}
              <AnimatePresence>
                {hintsShown > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginBottom: 16 }}
                  >
                    <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(158,86,100,0.55)', marginBottom: 8, fontWeight: 700 }}>
                      Pistas
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {riddle.hints.slice(0, hintsShown).map((hint, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          style={{
                            fontSize: 12, color: '#5a3020',
                            fontFamily: '"Georgia", serif',
                            fontStyle: 'italic',
                            padding: '6px 10px',
                            background: 'rgba(158,86,100,0.07)',
                            borderRadius: 2,
                            borderLeft: '2px solid rgba(158,86,100,0.3)',
                          }}
                        >
                          {hint}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Answer options */}
              {isMultiple ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {options.map((opt, i) => (
                    <motion.button
                      key={opt}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => started && !solved && checkAnswer(opt)}
                      disabled={solved || !started}
                      whileHover={solved || !started ? {} : { x: 4 }}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        textAlign: 'left',
                        background: 'rgba(255,250,240,0.7)',
                        border: '1px solid rgba(170,120,60,0.25)',
                        borderRadius: 2,
                        cursor: started && !solved ? 'pointer' : 'default',
                        fontSize: 14,
                        color: '#2a1810',
                        fontFamily: '"Georgia", serif',
                        letterSpacing: '0.01em',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <>
                  <motion.div animate={wrong ? { x: [-5, 5, -4, 4, -2, 2, 0] } : {}} transition={{ duration: 0.32 }}>
                    <input
                      type="text"
                      placeholder={started ? 'Tu respuesta...' : 'Primero acepta los permisos ←'}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && started && handleSubmit()}
                      disabled={solved || !started}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '12px 14px',
                        background: 'rgba(255,250,240,0.8)',
                        border: '1px solid rgba(170,120,60,0.3)',
                        borderRadius: 2, marginBottom: 10,
                        fontSize: 14, color: '#2a1810',
                        fontFamily: '"Georgia", serif',
                        outline: 'none',
                      }}
                    />
                  </motion.div>
                  <AnimatePresence mode="wait">
                    {solved ? (
                      <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{ textAlign: 'center', fontSize: 28, padding: '8px 0', color: '#9e5664' }}>✓</motion.div>
                    ) : (
                      <motion.button key="btn"
                        onClick={handleSubmit}
                        disabled={!answer.trim() || !started}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          width: '100%', padding: '13px 24px',
                          background: 'linear-gradient(135deg, #9e5664, #7a3848)',
                          color: '#fdf5e4', border: 'none', borderRadius: 2,
                          fontSize: 14, fontFamily: '"Georgia", serif',
                          cursor: 'pointer', letterSpacing: '0.05em',
                        }}
                      >
                        Responder
                      </motion.button>
                    )}
                  </AnimatePresence>
                </>
              )}

              {solved && isMultiple && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ textAlign: 'center', fontSize: 28, padding: '10px 0', color: '#9e5664', marginTop: 8 }}>
                  ✓
                </motion.div>
              )}

              {wrong && (
                <p style={{ marginTop: 10, color: '#9e5664', fontSize: 12, fontStyle: 'italic', fontFamily: '"Georgia", serif' }}>
                  Intenta de nuevo{hintsShown < riddle.hints.length && ' — revisa las pistas'}
                </p>
              )}
            </motion.div>
          </PageFrame>

          {/* Colophon */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'rgba(100,60,30,0.35)', letterSpacing: '0.1em' }}
          >
            — 2 —
          </motion.p>
        </motion.div>
      </motion.div>

      {/* ── Floating share guide — always visible above the book, before permissions granted ── */}
      <AnimatePresence>
        {!started && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{
              position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)',
              zIndex: 100,
              background: 'rgba(20, 10, 4, 0.93)',
              border: '1px solid rgba(212,168,64,0.4)',
              borderRadius: 8,
              padding: '10px 16px',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', gap: 14,
              maxWidth: '92vw',
            }}
          >
            {/* Screenshot thumbnail */}
            <div style={{
              flexShrink: 0,
              width: 90, height: 64,
              borderRadius: 5,
              overflow: 'hidden',
              border: '1px solid rgba(212,168,64,0.3)',
              background: '#1a1a2e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src="/share-guide.png"
                alt="Guía compartir pantalla"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  // fallback icon if image not found
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const p = e.currentTarget.nextSibling as HTMLElement;
                  if (p) p.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 22 }}>🖥️</span>
                <span style={{ fontSize: 9, color: 'rgba(212,168,64,0.7)', textAlign: 'center', lineHeight: 1.2 }}>
                  Pantalla<br />completa
                </span>
              </div>
            </div>

            {/* Steps */}
            <div>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(212,168,64,0.75)', fontWeight: 700, marginBottom: 6 }}>
                📺 Cómo compartir tu pantalla
              </p>
              <ol style={{ margin: 0, paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  'Selecciona la pestaña "Pantalla completa"',
                  'Elige el ícono de tu pantalla',
                  'Da clic en "Compartir"',
                ].map((step, i) => (
                  <li key={i} style={{ fontSize: 11.5, color: 'rgba(245,232,204,0.82)', fontFamily: '"Georgia",serif', lineHeight: 1.45 }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Arrow pointing down */}
            <div style={{
              position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid rgba(212,168,64,0.4)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cancel modal — shown when user dismissed the share dialog ── */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(8, 4, 2, 0.78)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 12 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{
                background: 'linear-gradient(150deg, #1e0d08 0%, #2d1505 50%, #1a0c04 100%)',
                border: '1px solid rgba(212,168,64,0.3)',
                borderRadius: 6,
                padding: '36px 32px',
                maxWidth: 400, width: '92vw',
                textAlign: 'center',
                boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 14 }}>🔒</div>
              <h3 style={{
                fontFamily: '"Playfair Display","Georgia",serif',
                fontSize: 20, fontWeight: 700,
                color: '#f5e8cc', marginBottom: 10, lineHeight: 1.3,
              }}>
                Cancelaste el permiso
              </h3>
              <p style={{
                fontSize: 13, color: 'rgba(245,232,204,0.6)',
                fontFamily: '"Georgia",serif', fontStyle: 'italic',
                lineHeight: 1.7, marginBottom: 24,
              }}>
                Para que tu sorpresa funcione correctamente, necesito que compartas tu pantalla. Es parte de guardar este momento especial.
              </p>
              <button
                onClick={handleStart}
                style={{
                  width: '100%', padding: '14px 24px',
                  background: 'linear-gradient(135deg, #9e5664, #7a3848)',
                  color: '#fdf5e4', border: 'none', borderRadius: 3,
                  fontSize: 14, fontFamily: '"Georgia",serif',
                  letterSpacing: '0.06em', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(100,30,50,0.4)',
                }}
              >
                Intentar de nuevo ♡
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
