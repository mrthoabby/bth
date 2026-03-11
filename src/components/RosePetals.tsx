'use client';
import { useEffect, useState } from 'react';

interface Petal {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  emoji: string;
}

const PETALS_EMOJIS = ['🌹', '🌸', '💐', '❤️', '🌺'];

export default function RosePetals({ count = 18 }: { count?: number }) {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    const generated: Petal[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      size: 16 + Math.random() * 18,
      rotation: Math.random() * 360,
      emoji: PETALS_EMOJIS[Math.floor(Math.random() * PETALS_EMOJIS.length)],
    }));
    setPetals(generated);
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {petals.map((petal) => (
        <span
          key={petal.id}
          style={{
            position: 'absolute',
            top: '-10%',
            left: `${petal.left}%`,
            fontSize: `${petal.size}px`,
            animation: `fall ${petal.duration}s ${petal.delay}s linear infinite`,
            transform: `rotate(${petal.rotation}deg)`,
            opacity: 0.42,
          }}
        >
          {petal.emoji}
        </span>
      ))}
      <style>{`
        @keyframes fall {
          0%   { top: -10%; transform: translateX(0) rotate(0deg); opacity: 0.5; }
          25%  { transform: translateX(30px) rotate(90deg); }
          50%  { transform: translateX(-20px) rotate(180deg); opacity: 0.4; }
          75%  { transform: translateX(20px) rotate(270deg); }
          100% { top: 110%; transform: translateX(0) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
