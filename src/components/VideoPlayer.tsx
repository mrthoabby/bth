'use client';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { duckAmbientMusic, unduckAmbientMusic } from '@/lib/sounds';

interface Props {
  src: string;
  title: string;
  onFinished: () => void;
  compact?: boolean;
  autoPlay?: boolean;
}

export default function VideoPlayer({ src, title, onFinished, compact = false, autoPlay = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (autoPlay) v.play().catch(() => {});
    const onEnded = () => { setIsPlaying(false); unduckAmbientMusic(); onFinished(); };
    const onPlay  = () => { setIsPlaying(true); duckAmbientMusic(); };
    const onPause = () => { setIsPlaying(false); unduckAmbientMusic(); };
    v.addEventListener('ended', onEnded);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      unduckAmbientMusic();
    };
  }, [src, onFinished, autoPlay]);

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0 0' }}>
        <div style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: '#000',
          boxShadow: '0 4px 24px rgba(44, 36, 40, 0.1)',
          height: isPlaying ? 340 : 160,
          transition: 'height 0.4s ease',
        }}>
          <video ref={videoRef} src={src} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
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
