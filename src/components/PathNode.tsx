'use client';
import { motion } from 'framer-motion';
import { PathConfig } from '@/lib/config';

interface Props {
  path: PathConfig;
  isUnlocked: boolean;
  isWatched: boolean;
  onClick: () => void;
  index: number;
}

export default function PathNode({ path, isUnlocked, isWatched, onClick, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, type: 'spring', stiffness: 80 }}
      onClick={onClick}
      className="cursor-pointer select-none"
    >
      <motion.div
        whileHover={{ scale: 1.04, y: -4 }}
        whileTap={{ scale: 0.97 }}
        className="glass-card rounded-2xl overflow-hidden relative"
        style={{
          border: isWatched
            ? '1px solid rgba(212,175,55,0.6)'
            : isUnlocked
            ? '1px solid rgba(232,69,90,0.5)'
            : '1px solid rgba(232,69,90,0.2)',
        }}
      >
        {/* Video preview with blur when locked */}
        <div className="relative h-36 overflow-hidden bg-black">
          {path.previewVideo ? (
            <video
              src={path.previewVideo}
              muted
              loop
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ filter: isUnlocked ? 'none' : 'blur(12px) brightness(0.5)' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-5xl"
              style={{ background: 'rgba(180,30,50,0.2)' }}
            >
              {path.emoji}
            </div>
          )}

          {/* Lock overlay */}
          {!isUnlocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl mb-1">🔒</span>
              <span className="text-xs text-rose-300 opacity-70 uppercase tracking-widest">
                Bloqueado
              </span>
              <div className="absolute inset-0 shimmer" />
            </div>
          )}

          {/* Watched badge */}
          {isWatched && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold rounded-full px-2 py-0.5">
              ✓ Visto
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{path.emoji}</span>
            <h3
              className="font-bold text-lg"
              style={{ color: isWatched ? 'var(--gold-light)' : 'var(--rose-light)' }}
            >
              {path.title}
            </h3>
          </div>
          <p className="text-sm opacity-60 text-rose-200">
            {isWatched
              ? '¡Ya desbloqueado! ✨'
              : isUnlocked
              ? 'Haz click para ver 🎬'
              : 'Resuelve el acertijo para desbloquear'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
