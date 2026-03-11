'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  secretWord: string;
  onVerified: () => void;
}

export default function SecretScreen({ secretWord, onVerified }: Props) {
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalize = (s: string) => s.trim().toLowerCase();

  const handleCheck = useCallback(() => {
    if (normalize(input) === normalize(secretWord)) {
      setWrong(false);
      setUnlocked(true);
    } else {
      setWrong(true);
      setInput('');
      setTimeout(() => setWrong(false), 1200);
    }
  }, [input, secretWord]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCheck();
    },
    [handleCheck]
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        background: 'radial-gradient(ellipse at center, #1a0a0e 0%, #0d0507 100%)',
        zIndex: 100,
      }}
    >
      {/* Rose */}
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        style={{ fontSize: 56, userSelect: 'none' }}
      >
        🌹
      </motion.div>

      {!unlocked && (
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <p
            style={{
              color: 'rgba(232, 170, 170, 0.85)',
              fontSize: 17,
              lineHeight: 1.7,
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            Por favor escribe la palabra secreta para comenzar
          </p>
        </div>
      )}

      <AnimatePresence>
        {!unlocked ? (
          <motion.div
            key="input-block"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
          >
            <motion.div
              animate={wrong ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.45 }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe aquí..."
                autoFocus
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: wrong
                    ? '1.5px solid rgba(232,69,90,0.7)'
                    : '1.5px solid rgba(158,86,100,0.4)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 16,
                  padding: '12px 18px',
                  width: 240,
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '0.08em',
                  transition: 'border-color 0.25s',
                }}
              />
            </motion.div>

            {wrong && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: 'rgba(232,69,90,0.8)', fontSize: 13, margin: 0 }}
              >
                Esa no es la palabra ❤️
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCheck}
              style={{
                background: 'linear-gradient(135deg, rgba(158,86,100,0.7), rgba(95,48,57,0.85))',
                border: '1px solid rgba(158,86,100,0.45)',
                borderRadius: 10,
                color: '#fff',
                fontSize: 15,
                padding: '11px 32px',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              Continuar
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="share-block"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
          >
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              style={{ fontSize: 40, userSelect: 'none' }}
            >
              💝
            </motion.div>
            <p
              style={{
                color: 'rgba(232,170,170,0.9)',
                fontSize: 15,
                margin: 0,
                textAlign: 'center',
                maxWidth: 280,
                lineHeight: 1.6,
              }}
            >
              ¡Eso es! Ahora dale clic para compartir tu pantalla y comenzar
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={onVerified}
              style={{
                background: 'linear-gradient(135deg, rgba(180,80,100,0.85), rgba(110,40,55,0.9))',
                border: '1.5px solid rgba(200,100,120,0.5)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 16,
                fontWeight: 600,
                padding: '14px 36px',
                cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(180,60,80,0.35)',
                letterSpacing: '0.03em',
              }}
            >
              🖥️ Compartir pantalla y comenzar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
