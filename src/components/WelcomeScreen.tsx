'use client';
import { useState } from 'react';
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

export default function WelcomeScreen({ riddle, recordingState, onStart, onSolved }: Props) {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [solved, setSolved] = useState(false);
  const [closingBook, setClosingBook] = useState(false);

  const isMultiple = (riddle.type === 'multiple' && riddle.options?.length) ? true : false;
  const options = riddle.options ?? [];

  const handleStart = async () => {
    setLoading(true);
    await onStart();
    setLoading(false);
    setStarted(true);
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

  const handleSubmit = () => {
    if (!isMultiple) checkAnswer(answer);
  };

  return (
    <motion.div
      initial={{ opacity: 1, scaleX: 1 }}
      animate={closingBook ? { opacity: 0.85, scaleX: 0.08 } : { opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.85, ease: [0.55, 0.08, 0.22, 0.99] }}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: 'clamp(20px, 4vw, 40px)',
        minHeight: '100vh',
        padding: 'clamp(24px, 4vw, 48px) clamp(20px, 5vw, 64px)',
        boxSizing: 'border-box',
        transformOrigin: 'center center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '8%',
          bottom: '8%',
          width: 8,
          transform: 'translateX(-50%)',
          borderRadius: 8,
          background: 'linear-gradient(180deg, rgba(158, 86, 100, 0.15), rgba(158, 86, 100, 0.35), rgba(158, 86, 100, 0.15))',
          boxShadow: '0 0 14px rgba(158, 86, 100, 0.12)',
          pointerEvents: 'none',
        }}
      />
      {/* ── Columna izquierda: bienvenida + permisos + CTA ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card"
        style={{
          flex: 1,
          minWidth: 280,
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(28px, 4vw, 44px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="heartbeat"
          style={{ fontSize: 36, marginBottom: 16, opacity: 0.9 }}
        >
          🌹
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="serif glow-text"
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          Feliz Cumpleaños
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="divider"
          style={{ marginBottom: 16, marginLeft: 0, transformOrigin: 'left' }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontSize: 15,
            color: 'var(--text)',
            lineHeight: 1.75,
            fontWeight: 500,
            marginBottom: 24,
          }}
        >
          Te preparé algo muy especial para este día. Para guardar este momento necesito acceso a tu cámara y micrófono.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            padding: '14px 0',
            marginBottom: 24,
          }}
        >
          {[
            { icon: '◎', label: 'Cámara' },
            { icon: '◎', label: 'Micrófono' },
            { icon: '◎', label: 'Pantalla completa' },
          ].map(({ icon, label }, i) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, letterSpacing: '0.02em' }}>
                {label}
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: started ? 'var(--rose)' : 'var(--rose)',
                  opacity: started ? 1 : 0.7,
                }}
              >
                {started ? '✓' : icon}
              </span>
            </div>
          ))}
        </motion.div>

        {!started && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>
            {recordingState === 'error' && (
              <p style={{ color: 'var(--rose)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
                Permite el acceso para continuar.
              </p>
            )}
            <button
              className="btn-rose pulse-rose"
              style={{ width: '100%', fontSize: 15, padding: '16px 24px' }}
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? 'Un momento...' : 'Comenzar mi sorpresa ♡'}
            </button>
          </motion.div>
        )}

        {started && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}
          >
            Permisos listos. Resuelve el acertijo →
          </motion.p>
        )}
      </motion.div>

      {/* ── Columna derecha: acertijo de entrada ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="glass-card"
        style={{
          flex: 1,
          minWidth: 280,
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(28px, 4vw, 44px)',
          opacity: started ? 1 : 0.6,
          pointerEvents: started ? 'auto' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ height: 2, width: 32, background: 'var(--rose)', borderRadius: 1 }} />
          <p
            style={{
              fontSize: 11,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.14em',
              color: 'var(--text)',
              fontWeight: 600,
            }}
          >
            Acertijo de entrada
          </p>
        </div>

        <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.85 }}>🔐</div>

        <p
          className="serif"
          style={{
            fontSize: 17,
            color: 'var(--text)',
            lineHeight: 1.75,
            fontStyle: 'italic',
            marginBottom: 20,
            fontWeight: 500,
          }}
        >
          &ldquo;{riddle.riddle}&rdquo;
        </p>

        <AnimatePresence>
          {hintsShown > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginBottom: 16, display: 'flex', flexDirection: 'column' as const, gap: 8 }}
            >
              <p
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                Pistas
              </p>
              {riddle.hints.slice(0, hintsShown).map((hint, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="hint-pill"
                >
                  {hint}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isMultiple ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="btn-ghost"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  fontSize: 15,
                  border: '1px solid var(--border-strong)',
                  borderRadius: 12,
                }}
                onClick={() => started && !solved && checkAnswer(opt)}
                disabled={solved || !started}
                whileHover={solved || !started ? {} : { scale: 1.01 }}
                whileTap={solved || !started ? {} : { scale: 0.99 }}
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
                className="romantic-input"
                placeholder={started ? 'Tu respuesta...' : 'Primero acepta los permisos ←'}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && started && handleSubmit()}
                disabled={solved || !started}
                style={{ marginBottom: 14 }}
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {solved ? (
                <motion.div
                  key="ok"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    textAlign: 'center' as const,
                    fontSize: 28,
                    padding: '10px 0',
                    color: 'var(--rose-vivid)',
                  }}
                >
                  ✓
                </motion.div>
              ) : (
                <motion.button
                  key="btn"
                  className="btn-rose-vivid"
                  style={{ width: '100%', fontSize: 15, padding: '16px 24px' }}
                  onClick={handleSubmit}
                  disabled={!answer.trim() || !started}
                  whileTap={{ scale: 0.98 }}
                >
                  Responder
                </motion.button>
              )}
            </AnimatePresence>
          </>
        )}

        {solved && isMultiple && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              textAlign: 'center' as const,
              fontSize: 28,
              padding: '10px 0',
              color: 'var(--rose-vivid)',
              marginTop: 8,
            }}
          >
            ✓
          </motion.div>
        )}

        {wrong && (
          <p style={{ marginTop: 12, color: 'var(--rose-vivid)', fontSize: 13, fontWeight: 500 }}>
            Intenta de nuevo{hintsShown < riddle.hints.length && ' — revisa las pistas'}
          </p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{ marginTop: 28, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.04em' }}
        >
          Hecho con amor ♡
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
