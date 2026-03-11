'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { RecordingState } from '@/hooks/useRecording';

interface Props {
  recordingState: RecordingState;
  onStart: () => Promise<void>;
}

const items = [
  { icon: '◎', label: 'Cámara' },
  { icon: '◎', label: 'Micrófono' },
  { icon: '◎', label: 'Pantalla — opcional' },
];

export default function PermissionsScreen({ recordingState, onStart }: Props) {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    await onStart();
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.6 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div
        className="glass-card"
        style={{ maxWidth: 400, width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}
      >
      {/* Rose icon — small, refined */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ fontSize: 32, marginBottom: 28, opacity: 0.85 }}
      >
        🌹
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="serif glow-text"
        style={{
          fontSize: 'clamp(28px, 6vw, 44px)',
          fontWeight: 400,
          color: 'var(--text)',
          letterSpacing: '-0.01em',
          marginBottom: 10,
        }}
      >
        Feliz Cumpleaños
      </motion.h1>

      {/* Thin divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="divider"
        style={{ marginBottom: 20 }}
      />

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          fontSize: 15,
          color: 'var(--text-muted)',
          maxWidth: 320,
          lineHeight: 1.75,
          marginBottom: 44,
          fontWeight: 400,
        }}
      >
        Te preparé algo muy especial para este día. Para vivir la experiencia completa necesito lo siguiente:
      </motion.p>

      {/* Permission list — clean, no card background */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        style={{
          width: '100%',
          maxWidth: 300,
          marginBottom: 44,
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '20px 0',
        }}
      >
        {items.map(({ icon, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              {label}
            </span>
            <span style={{ fontSize: 18, color: 'var(--rose)', opacity: 0.6 }}>{icon}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Error */}
      {recordingState === 'error' && (
        <p style={{ color: 'var(--rose-light)', fontSize: 13, marginBottom: 16, opacity: 0.7 }}>
          Permite el acceso a cámara y micrófono para continuar.
        </p>
      )}

      {/* CTA */}
      <motion.button
        className="btn-rose pulse-rose"
        style={{ minWidth: 220, fontSize: 14 }}
        onClick={handleStart}
        disabled={loading || recordingState === 'recording'}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        {loading ? 'Un momento...' : 'Comenzar mi sorpresa'}
      </motion.button>

      {/* Fine print */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        style={{ marginTop: 18, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.04em' }}
      >
        Hecho con amor ♡
      </motion.p>
      </div>
    </motion.div>
  );
}
