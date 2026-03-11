'use client';
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  src: string;
  title: string;
  onFinished: () => void;
  compact?: boolean;
}

export default function VideoPlayer({ src, title, onFinished, compact = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
    const handler = () => onFinished();
    v.addEventListener('ended', handler);
    return () => v.removeEventListener('ended', handler);
  }, [src, onFinished]);

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 20px 12px' }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 12, opacity: 0.9 }}>
          {title}
        </p>
        <div style={{ borderRadius: 16, overflow: 'hidden', background: '#000', flex: 1, minHeight: 200, boxShadow: '0 4px 24px rgba(44, 36, 40, 0.1)' }}>
          <video ref={videoRef} src={src} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <motion.button
          className="btn-ghost"
          style={{ marginTop: 12, alignSelf: 'center' }}
          onClick={onFinished}
          whileHover={{ scale: 1.03 }}
        >
          Continuar ❤️
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}
    >
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 20, textAlign: 'center' }}>
        {title}
      </h2>
      <div style={{ borderRadius: 20, overflow: 'hidden', width: '100%', maxWidth: 680, boxShadow: '0 4px 24px rgba(44, 36, 40, 0.1)' }}>
        <video ref={videoRef} src={src} controls style={{ width: '100%', background: '#000' }} />
      </div>
      <motion.button
        className="btn-rose"
        style={{ marginTop: 24, paddingLeft: 32, paddingRight: 32 }}
        onClick={onFinished}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.04 }}
      >
        Continuar ❤️
      </motion.button>
    </motion.div>
  );
}
