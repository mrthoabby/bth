'use client';
import { motion } from 'framer-motion';

interface Props {
  onContinue: () => void;
}

export default function BookCoverScreen({ onContinue }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: 'min(92vw, 520px)',
          minHeight: 620,
          borderRadius: 24,
          padding: 'clamp(26px, 4vw, 44px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(95, 48, 57, 0.18)',
          border: '1px solid rgba(158, 86, 100, 0.32)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 14,
            background: 'linear-gradient(180deg, rgba(158, 86, 100, 0.28), rgba(95, 48, 57, 0.45), rgba(158, 86, 100, 0.28))',
            boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.28)',
          }}
        />

        <div>
          <p style={{ color: 'var(--rose)', fontWeight: 700, letterSpacing: '0.12em', fontSize: 11, textTransform: 'uppercase', marginBottom: 18 }}>
            Portada
          </p>
          <h1 className="serif" style={{ fontSize: 'clamp(34px, 6vw, 52px)', lineHeight: 1.1, color: 'var(--text)', marginBottom: 14 }}>
            Nuestro Libro
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, maxWidth: 420 }}>
            Capitulo siguiente: un mensaje especial, fotos sorpresa y momentos bonitos para ti.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>Hecho con amor ♡</span>
          <button className="btn-rose-vivid" onClick={onContinue}>
            Abrir capitulo
          </button>
        </div>
      </div>
    </motion.div>
  );
}
