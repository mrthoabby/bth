'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Props { music: string; message: string; subMessage: string; onContinue: () => void; }

export default function BirthdayScene({ music, message, subMessage, onContinue }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasContinuedRef = useRef(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const audio = new Audio(music);
    audio.volume = 0.4;
    audioRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [music]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (countdown !== 0 || hasContinuedRef.current) return;
    hasContinuedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    onContinue();
  }, [countdown, onContinue]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'40px 24px', textAlign:'center' }}
    >
      <motion.div initial={{ scale:0.6, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', stiffness:80, delay:0.1 }}
        style={{ fontSize:48, marginBottom:24 }}>
        🎂
      </motion.div>

      <motion.h1
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
        className="serif glow-text"
        style={{ fontSize:'clamp(30px,6vw,48px)', fontWeight:400, color:'var(--text)', letterSpacing:'-0.01em', marginBottom:10 }}
      >
        ¡Feliz Cumpleaños!
      </motion.h1>

      <motion.div initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:0.6, duration:0.5 }}
        className="divider" style={{ marginBottom:28 }} />

      <motion.div
        initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8 }}
        style={{ maxWidth:560, width:'100%', marginBottom:26,
          borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'28px 16px' }}
      >
        <p style={{ fontSize:18, color:'var(--text)', lineHeight:1.75, fontWeight:400, marginBottom:14 }}>
          {message}
        </p>
        <p style={{ fontSize:14, color:'var(--text-muted)', fontStyle:'italic', lineHeight:1.65 }}>
          {subMessage}
        </p>
      </motion.div>

      <motion.div
        key={countdown}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 14 }}
        style={{
          width: 94,
          height: 94,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(199, 61, 82, 0.95), rgba(158, 86, 100, 0.95))',
          color: '#fff',
          fontSize: 36,
          fontWeight: 700,
          boxShadow: '0 12px 24px rgba(95, 48, 57, 0.25)',
          marginBottom: 10,
        }}
      >
        {countdown}
      </motion.div>

      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
        Iniciando...
      </p>
    </motion.div>
  );
}
