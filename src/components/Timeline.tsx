'use client';
import { motion } from 'framer-motion';
import { PathConfig } from '@/lib/config';
import PathNode from './PathNode';

interface FinalNodeProps {
  title: string;
  emoji: string;
  onClick: () => void;
  visible: boolean;
}

function FinalNode({ title, emoji, onClick, visible }: FinalNodeProps) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 80 }}
      onClick={onClick}
      className="cursor-pointer col-span-full flex justify-center mt-4"
    >
      <motion.div
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.97 }}
        className="glass-card rounded-2xl p-8 text-center max-w-sm w-full pulse-rose"
        style={{ border: '1px solid rgba(212,175,55,0.6)' }}
      >
        <div className="text-6xl mb-4 heartbeat">{emoji}</div>
        <h3 className="text-2xl font-bold glow-gold mb-2" style={{ color: 'var(--gold-light)' }}>
          {title}
        </h3>
        <p className="text-rose-300 text-sm opacity-80">
          Tu sorpresa final te espera...
        </p>
      </motion.div>
    </motion.div>
  );
}

interface Props {
  paths: PathConfig[];
  unlockedIds: Set<string>;
  watchedIds: Set<string>;
  onPathClick: (path: PathConfig) => void;
  finalTitle: string;
  finalEmoji: string;
  onFinalClick: () => void;
  allWatched: boolean;
}

export default function Timeline({
  paths,
  unlockedIds,
  watchedIds,
  onPathClick,
  finalTitle,
  finalEmoji,
  onFinalClick,
  allWatched,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 flex flex-col items-center"
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold glow-text mb-2 text-center"
        style={{ color: 'var(--rose-light)' }}
      >
        Tu aventura empieza aquí 🗺️
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-rose-300 opacity-70 mb-10 text-center text-sm"
      >
        Resuelve los acertijos para descubrir cada camino
      </motion.p>

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-10">
        <div className="flex justify-between text-xs text-rose-400 mb-1">
          <span>Progreso</span>
          <span>{watchedIds.size} / {paths.length}</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <motion.div
            className="h-2 rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--rose-dark), var(--rose-light))' }}
            initial={{ width: 0 }}
            animate={{ width: `${(watchedIds.size / paths.length) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {paths.map((path, i) => (
          <PathNode
            key={path.id}
            path={path}
            isUnlocked={unlockedIds.has(path.id)}
            isWatched={watchedIds.has(path.id)}
            onClick={() => onPathClick(path)}
            index={i}
          />
        ))}

        <FinalNode
          title={finalTitle}
          emoji={finalEmoji}
          onClick={onFinalClick}
          visible={allWatched}
        />
      </div>
    </motion.div>
  );
}
