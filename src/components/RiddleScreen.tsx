'use client';
import { useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiddleConfig } from '@/lib/config';

interface Props {
  riddle: RiddleConfig;
  title?: string;
  onSolved: () => void;
  compact?: boolean;
  onFirstTrySolve?: () => void;
}

function normalize(s: string) {
  return s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function RiddleScreen({ riddle, title, onSolved, compact = false, onFirstTrySolve }: Props) {
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [solved, setSolved] = useState(false);
  const [hadWrongAnswer, setHadWrongAnswer] = useState(false);

  const isMultiple = (riddle.type === 'multiple' && riddle.options?.length) ? true : false;
  const options = riddle.options ?? [];

  const checkAnswer = (selected: string) => {
    if (normalize(selected) === normalize(riddle.answer)) {
      setSolved(true);
      if (!hadWrongAnswer && onFirstTrySolve) setTimeout(onFirstTrySolve, 500);
      setTimeout(onSolved, 800);
    } else {
      setHadWrongAnswer(true);
      setWrong(true);
      setTimeout(() => setWrong(false), 500);
      if (hintsShown < riddle.hints.length) setHintsShown((h) => h + 1);
    }
  };

  const handleSubmit = () => { if (!isMultiple) checkAnswer(answer); };
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSubmit(); };

  const inner = (
    <div style={{ padding: compact ? '8px 4px' : 0, width: '100%' }}>
      {title && (
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--rose)', marginBottom: 10, opacity: 0.65 }}>
          {title}
        </p>
      )}

      {/* Game-style question box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(10, 40, 22, 0.88), rgba(6, 26, 14, 0.92))',
        border: '2px solid rgba(68, 190, 95, 0.65)',
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 14,
        boxShadow: '0 0 0 1px rgba(68,190,95,0.1), 0 0 16px rgba(68,190,95,0.08)',
        position: 'relative',
      }}>
        {/* Corner accents */}
        <div style={{ position: 'absolute', top: -2, left: -2, width: 9, height: 9, borderTop: '2.5px solid rgba(100,230,130,0.85)', borderLeft: '2.5px solid rgba(100,230,130,0.85)', borderRadius: '3px 0 0 0' }} />
        <div style={{ position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderTop: '2.5px solid rgba(100,230,130,0.85)', borderRight: '2.5px solid rgba(100,230,130,0.85)', borderRadius: '0 3px 0 0' }} />
        <div style={{ position: 'absolute', bottom: -2, left: -2, width: 9, height: 9, borderBottom: '2.5px solid rgba(100,230,130,0.85)', borderLeft: '2.5px solid rgba(100,230,130,0.85)', borderRadius: '0 0 0 3px' }} />
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderBottom: '2.5px solid rgba(100,230,130,0.85)', borderRight: '2.5px solid rgba(100,230,130,0.85)', borderRadius: '0 0 3px 0' }} />

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          style={{ fontSize: compact ? 15 : 18, color: '#c8ffd8', lineHeight: 1.7, margin: 0, fontStyle: 'italic', fontWeight: 400 }}
        >
          &ldquo;{riddle.riddle}&rdquo;
        </motion.p>
      </div>

      <AnimatePresence>
        {hintsShown > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: 2 }}>Pistas</p>
            {riddle.hints.slice(0, hintsShown).map((hint, i) => (
              <motion.span key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="hint-pill">
                {hint}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isMultiple ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {options.map((opt, i) => (
            <motion.button
              key={opt}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              onClick={() => !solved && checkAnswer(opt)}
              disabled={solved}
              whileHover={solved ? {} : { scale: 1.04, y: -1 }}
              whileTap={solved ? {} : { scale: 0.96 }}
              style={{
                padding: '11px 8px',
                textAlign: 'center',
                fontSize: compact ? 13 : 14,
                fontWeight: 600,
                color: solved ? 'rgba(180,230,190,0.5)' : 'rgba(210,255,220,0.95)',
                background: solved ? 'rgba(12,36,20,0.3)' : 'rgba(14,44,24,0.75)',
                border: `1.5px solid ${solved ? 'rgba(68,190,95,0.18)' : 'rgba(68,190,95,0.5)'}`,
                borderRadius: 10,
                cursor: solved ? 'default' : 'pointer',
                transition: 'all 0.15s',
                boxShadow: solved ? 'none' : '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(100,230,130,0.08)',
                outline: 'none',
              }}
            >
              {opt}
            </motion.button>
          ))}
        </div>
      ) : (
        <>
          <motion.div animate={wrong ? { x: [-5, 5, -4, 4, -2, 2, 0] } : {}} transition={{ duration: 0.32 }}>
            <input type="text" className="romantic-input" placeholder="Tu respuesta..."
              value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={handleKey}
              disabled={solved} style={{ marginBottom: 12 }} />
          </motion.div>

          <AnimatePresence mode="wait">
            {solved ? (
              <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{ textAlign: 'center', fontSize: 28, padding: '8px 0', color: 'var(--rose-deep)' }}>✓</motion.div>
            ) : (
              <motion.button
                key="btn"
                onClick={handleSubmit}
                disabled={!answer.trim()}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: answer.trim()
                    ? 'linear-gradient(135deg, rgba(175,55,78,0.92), rgba(135,38,58,0.92))'
                    : 'rgba(55,28,38,0.5)',
                  border: `1.5px solid ${answer.trim() ? 'rgba(215,95,115,0.65)' : 'rgba(110,55,65,0.3)'}`,
                  borderRadius: 12,
                  color: answer.trim() ? '#fff' : 'rgba(190,140,155,0.45)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: answer.trim() ? 'pointer' : 'default',
                  boxShadow: answer.trim() ? '0 4px 16px rgba(175,55,78,0.38)' : 'none',
                  transition: 'all 0.2s',
                  letterSpacing: '0.04em',
                  outline: 'none',
                }}
              >
                Responder →
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      {solved && isMultiple && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ textAlign: 'center', fontSize: 28, padding: '12px 0', color: 'var(--rose-deep)' }}>✓</motion.div>
      )}

      {wrong && (
        <motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 10, color: 'rgba(255,115,115,0.9)', fontSize: 12 }}
        >
          Intenta de nuevo{hintsShown < riddle.hints.length && ' — revisa las pistas'}
        </motion.p>
      )}
    </div>
  );

  if (compact) return inner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}
    >
      <div style={{ maxWidth: 460, width: '100%', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '36px 24px' }}>
        {inner}
      </div>
    </motion.div>
  );
}
