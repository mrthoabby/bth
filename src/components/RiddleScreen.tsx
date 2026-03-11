'use client';
import { useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiddleConfig } from '@/lib/config';

interface Props { riddle: RiddleConfig; title?: string; onSolved: () => void; compact?: boolean; }

function normalize(s: string) {
  return s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function RiddleScreen({ riddle, title, onSolved, compact = false }: Props) {
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [solved, setSolved] = useState(false);

  const isMultiple = (riddle.type === 'multiple' && riddle.options?.length) ? true : false;
  const options = riddle.options ?? [];

  const checkAnswer = (selected: string) => {
    if (normalize(selected) === normalize(riddle.answer)) {
      setSolved(true);
      setTimeout(onSolved, 800);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 500);
      if (hintsShown < riddle.hints.length) setHintsShown((h) => h + 1);
    }
  };

  const handleSubmit = () => {
    if (!isMultiple) checkAnswer(answer);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSubmit(); };

  const inner = (
    <div style={{ padding: compact ? '24px 22px' : 0, width: '100%' }}>
      {title && (
        <p style={{ fontSize:10, textTransform:'uppercase' as const, letterSpacing:'0.14em', color:'var(--rose)', marginBottom:18, opacity:0.65 }}>
          {title}
        </p>
      )}

      <div style={{ fontSize: compact ? 28 : 36, marginBottom:14, opacity:0.7 }}>🔐</div>

      <motion.p
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
        className={compact ? '' : 'serif'}
        style={{ fontSize: compact ? 16 : 19, color:'var(--text)', lineHeight:1.75, marginBottom:24, fontWeight: 400, fontStyle:'italic' }}
      >
        &ldquo;{riddle.riddle}&rdquo;
      </motion.p>

      <AnimatePresence>
        {hintsShown > 0 && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
            style={{ marginBottom:18, display:'flex', flexDirection:'column' as const, gap:7 }}>
            <p style={{ fontSize:10, textTransform:'uppercase' as const, letterSpacing:'0.12em', color:'var(--gold)', marginBottom:2 }}>Pistas</p>
            {riddle.hints.slice(0, hintsShown).map((hint, i) => (
              <motion.span key={i} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }} className="hint-pill">
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
                fontSize: compact ? 14 : 15,
                border: '1px solid var(--border-strong)',
                borderRadius: 12,
              }}
              onClick={() => !solved && checkAnswer(opt)}
              disabled={solved}
              whileHover={solved ? {} : { scale: 1.01 }}
              whileTap={solved ? {} : { scale: 0.99 }}
            >
              {opt}
            </motion.button>
          ))}
        </div>
      ) : (
        <>
          <motion.div animate={wrong ? { x:[-5,5,-4,4,-2,2,0] } : {}} transition={{ duration:0.32 }}>
            <input type="text" className="romantic-input" placeholder="Tu respuesta..."
              value={answer} onChange={(e) => setAnswer(e.target.value)} onKeyDown={handleKey}
              disabled={solved} style={{ marginBottom:13 }} />
          </motion.div>

          <AnimatePresence mode="wait">
            {solved ? (
              <motion.div key="ok" initial={{ scale:0 }} animate={{ scale:1 }}
                style={{ textAlign:'center' as const, fontSize:28, padding:'10px 0', color:'var(--rose-deep)' }}>✓</motion.div>
            ) : (
              <motion.button key="btn" className="btn-rose" style={{ width:'100%', fontSize:13 }}
                onClick={handleSubmit} disabled={!answer.trim()} whileTap={{ scale:0.97 }}>
                Responder
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      {solved && isMultiple && (
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
          style={{ textAlign:'center', fontSize:28, padding:'14px 0', color:'var(--rose-deep)' }}>✓</motion.div>
      )}

      {wrong && (
        <p style={{ marginTop:10, color:'var(--rose-deep)', fontSize:12, opacity:0.9 }}>
          Intenta de nuevo{hintsShown < riddle.hints.length && ' — revisa las pistas'}
        </p>
      )}
    </div>
  );

  if (compact) return inner;

  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }} transition={{ duration:0.4 }}
      style={{ display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:24 }}
    >
      <div style={{ maxWidth:460, width:'100%', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'36px 24px' }}>
        {inner}
      </div>
    </motion.div>
  );
}
