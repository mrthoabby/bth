'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { onDone: () => void; }

const SEGS = [
  { label: 'Desayuno en Café Saudade', emoji: '☕', color: '#9e1c1c' },
  { label: 'El cariño de siempre',     emoji: '💕', color: '#5e1e82' },
  { label: 'Viaje a París',            emoji: '✈️', color: '#1650a0' },
  { label: 'El cariño de siempre',     emoji: '💕', color: '#5e1e82' },
  { label: 'Nueva Biblia',             emoji: '📖', color: '#14682e' },
  { label: 'El cariño de siempre',     emoji: '💕', color: '#5e1e82' },
  { label: 'Patines',                  emoji: '🛼', color: '#a03c08' },
  { label: 'El cariño de siempre',     emoji: '💕', color: '#5e1e82' },
];

const N  = SEGS.length;
const SZ = 380;                  // SVG canvas size
const CX = SZ / 2, CY = SZ / 2, R = 172;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

// Segment i centred at top when i=0
function slicePath(i: number) {
  const seg = 360 / N;
  const s = toRad(i * seg - 90 - seg / 2);
  const e = toRad(i * seg - 90 + seg / 2);
  const x1 = CX + R * Math.cos(s), y1 = CY + R * Math.sin(s);
  const x2 = CX + R * Math.cos(e), y2 = CY + R * Math.sin(e);
  return `M ${CX} ${CY} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}
function sliceMid(i: number, r: number) {
  const deg = i * (360 / N) - 90;
  return { x: CX + r * Math.cos(toRad(deg)), y: CY + r * Math.sin(toRad(deg)) };
}

const UNIQUE_LABELS = [...new Map(SEGS.map(s => [s.label, s])).values()];

// ── Audio helpers ──────────────────────────────────────────────────────────────
function playTick(ac: AudioContext, vol = 0.55) {
  try {
    const len = Math.ceil(ac.sampleRate * 0.022);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    g.gain.value = vol;
    src.connect(g); g.connect(ac.destination);
    src.start();
  } catch { /* ignore */ }
}

function scheduleSpinSounds(ac: AudioContext, onLast: () => void) {
  // Fast phase: 25 ticks, ~60ms each → 1500ms
  // Slow phase: 15 ticks with increasing gap → ~2700ms
  // Total ≈ 4200ms matching CSS transition
  const intervals: number[] = [
    ...Array(25).fill(60),
    100, 112, 126, 140, 156, 172, 190, 208, 228, 250, 275, 302, 330, 360, 395,
  ];
  let t = 0;
  intervals.forEach((gap, idx) => {
    t += gap;
    const isLast = idx === intervals.length - 1;
    setTimeout(() => {
      const vol = isLast ? 0.9 : (idx >= 30 ? 0.7 : 0.5);
      playTick(ac, vol);
      if (isLast) onLast();
    }, t);
  });
}

function playFanfare(ac: AudioContext) {
  try {
    // Ascending triumphant arpeggio
    const notes = [72, 76, 79, 84, 88, 84, 91];
    notes.forEach((note, i) => {
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.type  = 'triangle';
      osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
      osc.connect(g); g.connect(ac.destination);
      const t = ac.currentTime + 0.05 + i * 0.11;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(i === 6 ? 0.38 : 0.25, t + 0.025);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.start(t); osc.stop(t + 0.95);
    });
    // Underlying chord swell
    [60, 64, 67, 72].forEach((note) => {
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.type  = 'sine';
      osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
      osc.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(0.08, ac.currentTime + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.8);
      osc.start(ac.currentTime); osc.stop(ac.currentTime + 2.0);
    });
  } catch { /* ignore */ }
}

function playDrone(ac: AudioContext) {
  try {
    // Low suspense pulse that fades out at spin end
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(48, ac.currentTime + 4.2);
    osc.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(0.06, ac.currentTime + 0.6);
    g.gain.linearRampToValueAtTime(0.06, ac.currentTime + 3.5);
    g.gain.linearRampToValueAtTime(0, ac.currentTime + 4.5);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + 4.6);
  } catch { /* ignore */ }
}

export default function RouletteScreen({ onDone }: Props) {
  const [spinning, setSpinning]     = useState(false);
  const [rotation, setRotation]     = useState(0);
  const [done, setDone]             = useState(false);
  const [revealing, setRevealing]   = useState(false);
  const acRef = useRef<AudioContext | null>(null);

  const spin = () => {
    if (spinning || done) return;
    try {
      acRef.current = new AudioContext();
      if (acRef.current.state === 'suspended') acRef.current.resume();
    } catch { /* ignore */ }

    const ac = acRef.current;
    const next = rotation + 5 * 360; // always lands on segment 0
    setRotation(next);
    setSpinning(true);

    if (ac) {
      playDrone(ac);
      scheduleSpinSounds(ac, () => {
        // last tick fired — brief suspense pause before revealing
        setRevealing(true);
        setTimeout(() => {
          if (ac) playFanfare(ac);
          setSpinning(false);
          setDone(true);
          setRevealing(false);
        }, 700); // 700ms suspense after last tick
      });
    } else {
      setTimeout(() => { setSpinning(false); setDone(true); }, 4300);
    }
  };

  const wheelSize = Math.min(typeof window !== 'undefined' ? window.innerWidth * 0.88 : 380, 380);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, rgba(48,6,36,0.98) 0%, rgba(6,2,14,0.99) 100%)',
        gap: 16, padding: '20px 16px', overflowY: 'auto',
      }}
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ textAlign: 'center', maxWidth: 360 }}>
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold)', margin: '0 0 6px', opacity: 0.9 }}>
          Premio especial
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f8dde4', margin: 0 }}>
          🎰 ¡Ganaste un tiro en la ruleta!
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(230,180,195,0.72)', margin: '6px 0 0', lineHeight: 1.65 }}>
          Por cada isla, cada enigma, cada paso de esta aventura.
        </p>
      </motion.div>

      {/* Wheel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 140, damping: 18 }}
        style={{ position: 'relative', width: wheelSize, height: wheelSize + 22, flexShrink: 0 }}
      >
        {/* Glow ring (pulses while spinning) */}
        <motion.div
          animate={spinning ? { opacity: [0.4, 0.9, 0.4] } : { opacity: 0.25 }}
          transition={spinning ? { repeat: Infinity, duration: 0.6, ease: 'easeInOut' } : {}}
          style={{
            position: 'absolute', top: 22, left: 0,
            width: wheelSize, height: wheelSize,
            borderRadius: '50%',
            boxShadow: '0 0 50px rgba(220,80,120,0.5), 0 0 100px rgba(175,55,78,0.25)',
            pointerEvents: 'none',
          }}
        />
        {/* Pointer ▼ */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '13px solid transparent', borderRight: '13px solid transparent',
          borderTop: '26px solid #f4c8d4',
          zIndex: 10,
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.8))',
        }} />
        {/* Spinning wheel */}
        <div style={{
          position: 'absolute', top: 22, left: 0,
          width: wheelSize, height: wheelSize,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid rgba(255,255,255,0.2)',
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? `transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 1)` : 'none',
          willChange: 'transform',
        }}>
          <svg width={wheelSize} height={wheelSize} viewBox={`0 0 ${SZ} ${SZ}`}>
            {SEGS.map((seg, i) => {
              const em  = sliceMid(i, R * 0.60);
              const em2 = sliceMid(i, R * 0.32);
              return (
                <g key={i}>
                  <path d={slicePath(i)} fill={seg.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} />
                  {/* Lighter inner area */}
                  <path d={slicePath(i)} fill="rgba(255,255,255,0.06)" stroke="none" />
                  <text x={em.x} y={em.y} textAnchor="middle" dominantBaseline="middle"
                    fontSize={26} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {seg.emoji}
                  </text>
                  <text x={em2.x} y={em2.y} textAnchor="middle" dominantBaseline="middle"
                    fontSize={9} fill="rgba(255,255,255,0.7)" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {i === 0 ? '☕' : ''}
                  </text>
                </g>
              );
            })}
            {/* Divider lines */}
            {SEGS.map((_, i) => {
              const a = toRad(i * (360 / N) - 90 - (360 / N) / 2);
              return (
                <line key={`d${i}`}
                  x1={CX} y1={CY}
                  x2={(CX + R * Math.cos(a)).toFixed(1)}
                  y2={(CY + R * Math.sin(a)).toFixed(1)}
                  stroke="rgba(0,0,0,0.4)" strokeWidth={2}
                />
              );
            })}
            {/* Outer ring highlight */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2.5} />
            {/* Hub */}
            <circle cx={CX} cy={CY} r={22} fill="#160a20" stroke="rgba(255,255,255,0.35)" strokeWidth={2.5} />
            <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize={16}
              style={{ userSelect: 'none', pointerEvents: 'none' }}>⭐</text>
          </svg>
        </div>
      </motion.div>

      {/* Legend — 2 column compact */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px',
          width: '100%', maxWidth: 320,
        }}>
        {UNIQUE_LABELS.map((seg) => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,210,225,0.68)' }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span>{seg.emoji} {seg.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Status / action */}
      <AnimatePresence mode="wait">
        {revealing && (
          <motion.p key="suspense"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: [0, 1, 0.7, 1] }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ fontSize: 16, fontWeight: 700, color: '#f8dde4', textAlign: 'center', margin: 0 }}
          >
            🥁 El resultado es...
          </motion.p>
        )}

        {!done && !revealing && (
          <motion.button
            key="spin-btn"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            whileHover={!spinning ? { scale: 1.05 } : {}}
            whileTap={!spinning ? { scale: 0.96 } : {}}
            disabled={spinning}
            onClick={spin}
            style={{
              padding: '15px 40px',
              background: spinning
                ? 'rgba(80,30,50,0.5)'
                : 'linear-gradient(135deg, rgba(175,55,78,0.95), rgba(135,38,58,0.95))',
              border: `1.5px solid ${spinning ? 'rgba(215,95,115,0.2)' : 'rgba(215,95,115,0.6)'}`,
              borderRadius: 14,
              color: spinning ? 'rgba(255,200,210,0.4)' : '#fff',
              fontSize: 15, fontWeight: 700,
              cursor: spinning ? 'default' : 'pointer',
              boxShadow: spinning ? 'none' : '0 4px 24px rgba(175,55,78,0.45)',
              transition: 'all 0.2s', letterSpacing: '0.03em',
            }}
          >
            {spinning ? '¡Girando...! 🌀' : '¡Girar la Ruleta! 🎰'}
          </motion.button>
        )}

        {done && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1, 1.2, 1], rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 0.8 }}
              style={{ fontSize: 46 }}
            >☕</motion.div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#f8dde4', margin: '0 0 4px' }}>¡Ganaste! 🎉</p>
              <p style={{ fontSize: 14, color: 'rgba(255,210,220,0.88)', margin: 0 }}>Desayuno en Café Saudade ☕</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={onDone}
              style={{
                padding: '14px 36px',
                background: 'linear-gradient(135deg, rgba(175,55,78,0.95), rgba(135,38,58,0.95))',
                border: '1.5px solid rgba(215,95,115,0.65)',
                borderRadius: 14, color: '#fff',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 22px rgba(175,55,78,0.45)', letterSpacing: '0.03em',
                marginTop: 4,
              }}
            >
              ▶ Ver Video Final
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
