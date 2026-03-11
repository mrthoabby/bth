'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Props { music: string; message: string; subMessage: string; onContinue: () => void; }

// Gold/rose ornate border SVG
function OrnateFrame() {
  return (
    <svg
      viewBox="0 0 480 560"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4a840" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#f0cc70" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#c89430" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e8b850" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Outer border */}
      <rect x="10" y="10" width="460" height="540" fill="none" stroke="url(#gold-grad)" strokeWidth="1.2" opacity="0.7" />
      {/* Inner border */}
      <rect x="18" y="18" width="444" height="524" fill="none" stroke="url(#gold-grad)" strokeWidth="0.5" opacity="0.4" />
      {/* Double border lines */}
      <rect x="22" y="22" width="436" height="516" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.5" />

      {/* Corner ornaments */}
      {/* Top-left */}
      <g opacity="0.85">
        <path d="M 10 40 L 10 10 L 40 10" fill="none" stroke="url(#gold-grad)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="10" r="3" fill="#d4a840" opacity="0.8" />
        <path d="M 22 10 L 30 18 M 10 22 L 18 30" stroke="#d4a840" strokeWidth="0.8" opacity="0.5" />
      </g>
      {/* Top-right */}
      <g opacity="0.85">
        <path d="M 440 10 L 470 10 L 470 40" fill="none" stroke="url(#gold-grad)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="470" cy="10" r="3" fill="#d4a840" opacity="0.8" />
        <path d="M 458 10 L 450 18 M 470 22 L 462 30" stroke="#d4a840" strokeWidth="0.8" opacity="0.5" />
      </g>
      {/* Bottom-left */}
      <g opacity="0.85">
        <path d="M 10 520 L 10 550 L 40 550" fill="none" stroke="url(#gold-grad)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="550" r="3" fill="#d4a840" opacity="0.8" />
        <path d="M 22 550 L 30 542 M 10 538 L 18 530" stroke="#d4a840" strokeWidth="0.8" opacity="0.5" />
      </g>
      {/* Bottom-right */}
      <g opacity="0.85">
        <path d="M 440 550 L 470 550 L 470 520" fill="none" stroke="url(#gold-grad)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="470" cy="550" r="3" fill="#d4a840" opacity="0.8" />
        <path d="M 458 550 L 450 542 M 470 538 L 462 530" stroke="#d4a840" strokeWidth="0.8" opacity="0.5" />
      </g>

      {/* Top center ornament */}
      <g transform="translate(240, 10)" opacity="0.7">
        <line x1="-60" y1="0" x2="-18" y2="0" stroke="url(#gold-grad)" strokeWidth="0.8" />
        <line x1="18" y1="0" x2="60" y2="0" stroke="url(#gold-grad)" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="5" fill="#d4a840" opacity="0.7" />
        <circle cx="-10" cy="0" r="2" fill="#d4a840" opacity="0.5" />
        <circle cx="10" cy="0" r="2" fill="#d4a840" opacity="0.5" />
      </g>
      {/* Bottom center ornament */}
      <g transform="translate(240, 550)" opacity="0.7">
        <line x1="-60" y1="0" x2="-18" y2="0" stroke="url(#gold-grad)" strokeWidth="0.8" />
        <line x1="18" y1="0" x2="60" y2="0" stroke="url(#gold-grad)" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="5" fill="#d4a840" opacity="0.7" />
        <circle cx="-10" cy="0" r="2" fill="#d4a840" opacity="0.5" />
        <circle cx="10" cy="0" r="2" fill="#d4a840" opacity="0.5" />
      </g>
    </svg>
  );
}

// Decorative divider for inside the cover
function GoldDivider() {
  return (
    <svg width="260" height="16" viewBox="0 0 260 16" fill="none" style={{ display: 'block' }}>
      <line x1="0" y1="8" x2="100" y2="8" stroke="#d4a840" strokeWidth="0.7" opacity="0.6" />
      <line x1="160" y1="8" x2="260" y2="8" stroke="#d4a840" strokeWidth="0.7" opacity="0.6" />
      <circle cx="130" cy="8" r="5" fill="#d4a840" opacity="0.75" />
      <circle cx="112" cy="8" r="2.5" fill="#d4a840" opacity="0.5" />
      <circle cx="148" cy="8" r="2.5" fill="#d4a840" opacity="0.5" />
      <circle cx="98" cy="8" r="1.5" fill="#d4a840" opacity="0.3" />
      <circle cx="162" cy="8" r="1.5" fill="#d4a840" opacity="0.3" />
    </svg>
  );
}

export default function BirthdayScene({ music, message, subMessage, onContinue }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasContinuedRef = useRef(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const audio = new Audio(music);
    audio.volume = 0.4;
    audioRef.current = audio;
    audio.play().catch(() => {});
    return () => { audio.pause(); audio.src = ''; };
  }, [music]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (countdown !== 0 || hasContinuedRef.current) return;
    hasContinuedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    onContinue();
  }, [countdown, onContinue]);

  return (
    /* Deep dark background — bookshelves */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        width: '100vw', height: '100vh',
        background: 'radial-gradient(ellipse at 40% 30%, #1f0a14 0%, #120618 45%, #080310 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}
    >
      {/* Floating ambient particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.08, 0.22, 0.08] }}
          transition={{ duration: 5 + i * 0.5, repeat: Infinity, delay: i * 0.45 }}
          style={{
            position: 'absolute',
            left: `${5 + i * 8}%`,
            bottom: `${6 + (i % 5) * 10}%`,
            width: i % 3 === 0 ? 4 : 2,
            height: i % 3 === 0 ? 4 : 2,
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(212,168,64,0.5)' : 'rgba(180,100,120,0.4)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* THE BOOK COVER */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0, rotateY: -8 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 0.8, 0.36, 1] }}
        style={{
          width: 'min(480px, 92vw)',
          height: 'min(560px, 88vh)',
          position: 'relative',
          background: 'linear-gradient(150deg, #1e0d18 0%, #2d1225 35%, #1a0912 65%, #0e0608 100%)',
          boxShadow: `
            -4px 0 12px rgba(0,0,0,0.8),
            4px 0 8px rgba(0,0,0,0.5),
            0 20px 60px rgba(0,0,0,0.9),
            inset 2px 0 8px rgba(255,200,120,0.04),
            inset -1px 0 4px rgba(0,0,0,0.5)
          `,
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '44px 40px',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Ornate frame overlay */}
        <OrnateFrame />

        {/* Subtle cloth texture on cover */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 3,
          backgroundImage: `repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 3px
          ), repeating-linear-gradient(
            90deg, transparent, transparent 2px,
            rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px
          )`,
          pointerEvents: 'none',
        }} />

        {/* Spine effect */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 14,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.6), rgba(255,190,80,0.05) 50%, transparent)',
          borderRadius: '3px 0 0 3px',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* Series label */}
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em',
              color: 'rgba(212,168,64,0.65)', marginBottom: 18, fontWeight: 600,
            }}
          >
            Una historia de amor
          </motion.p>

          {/* Rose decoration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 80 }}
            className="heartbeat"
            style={{ fontSize: 42, marginBottom: 16, filter: 'drop-shadow(0 0 12px rgba(220,80,100,0.5))' }}
          >
            🌹
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontSize: 'clamp(28px,5.5vw,42px)',
              fontWeight: 700,
              color: '#f5e8cc',
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
              marginBottom: 18,
              textShadow: '0 2px 16px rgba(0,0,0,0.6)',
            }}
          >
            ¡Feliz<br />Cumpleaños!
          </motion.h1>

          {/* Gold divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{ marginBottom: 22 }}
          >
            <GoldDivider />
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            style={{
              maxWidth: 340,
              padding: '18px 0',
              borderTop: '1px solid rgba(212,168,64,0.15)',
              borderBottom: '1px solid rgba(212,168,64,0.15)',
              marginBottom: 24,
            }}
          >
            <p style={{
              fontSize: 'clamp(13px,2vw,16px)',
              color: 'rgba(245,232,204,0.88)',
              lineHeight: 1.8,
              fontFamily: '"Georgia", serif',
              fontWeight: 400,
              marginBottom: 10,
            }}>
              {message}
            </p>
            <p style={{
              fontSize: 'clamp(11px,1.6vw,14px)',
              color: 'rgba(212,168,64,0.65)',
              fontStyle: 'italic',
              lineHeight: 1.7,
              fontFamily: '"Georgia", serif',
            }}>
              {subMessage}
            </p>
          </motion.div>

          {/* Countdown — styled as an elegant chapter number */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(212,168,64,0.4)', fontWeight: 600 }}>
              La aventura comienza en
            </p>
            <motion.div
              key={countdown}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              style={{
                width: 56, height: 56,
                border: '1.5px solid rgba(212,168,64,0.45)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(212,168,64,0.06)',
                boxShadow: '0 0 20px rgba(212,168,64,0.12)',
              }}
            >
              <span style={{
                fontFamily: '"Playfair Display", "Georgia", serif',
                fontSize: 26, fontWeight: 700,
                color: '#d4a840',
              }}>
                {countdown}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
