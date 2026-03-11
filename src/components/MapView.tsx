'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StopConfig, StopChallengeConfig } from '@/lib/config';
import RiddleScreen from './RiddleScreen';
import VideoPlayer from './VideoPlayer';

// ─── ViewBox constants ────────────────────────────────────────────────────────
const VBX = -60, VBY = -50, VBW = 1020, VBH = 660;

// ─── Terrain components ───────────────────────────────────────────────────────
function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const H = 22 * s, W = 12 * s;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-2 * s} y={0} width={4 * s} height={8 * s} fill="#6b4f2a" />
      <polygon points={`0,${-H} ${-W},0 ${W},0`} fill="#235c23" />
      <polygon points={`0,${-H * 0.76} ${-W * 0.82},${-H * 0.26} ${W * 0.82},${-H * 0.26}`} fill="#2e7a2e" />
      <polygon points={`0,${-H * 0.52} ${-W * 0.62},${-H * 0.52} ${W * 0.62},${-H * 0.52}`} fill="#3a9a3a" />
    </g>
  );
}

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M 0 0 C 4 -8 3 -16 1 -24" stroke="#9b7a1a" strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={-11} cy={-24} rx={10} ry={3.5} fill="#44a844" transform="rotate(-20,-11,-24)" />
      <ellipse cx={11} cy={-25} rx={10} ry={3.5} fill="#44a844" transform="rotate(20,11,-25)" />
      <ellipse cx={0} cy={-28} rx={8} ry={3} fill="#5abe5a" transform="rotate(-5,0,-28)" />
      <ellipse cx={-6} cy={-30} rx={7} ry={2.5} fill="#3aaa3a" transform="rotate(-40,-6,-30)" />
      <ellipse cx={7} cy={-29} rx={7} ry={2.5} fill="#3aaa3a" transform="rotate(35,7,-29)" />
    </g>
  );
}

function MountainPeak({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const H = 32 * s, W = 20 * s;
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Shadow side */}
      <polygon points={`0,${-H} ${W},0`} fill="#5a6472" />
      {/* Main face */}
      <polygon points={`${-W},0 0,${-H} ${W},0`} fill="#8090a4" />
      {/* Snow cap */}
      <polygon points={`${-W * 0.32},${-H * 0.5} 0,${-H} ${W * 0.32},${-H * 0.5}`} fill="#e8edf5" />
      <polygon points={`${-W * 0.18},${-H * 0.65} 0,${-H} ${W * 0.22},${-H * 0.68}`} fill="#fff" opacity={0.85} />
    </g>
  );
}

function MountainLarge({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const H = 48 * s, W = 30 * s;
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={`0,${-H} ${W},0`} fill="#4a5562" />
      <polygon points={`${-W},0 0,${-H} ${W},0`} fill="#6a7a8e" />
      <polygon points={`${-W * 0.35},${-H * 0.47} 0,${-H} ${W * 0.35},${-H * 0.47}`} fill="#dce3ef" />
      <polygon points={`${-W * 0.2},${-H * 0.64} 0,${-H} ${W * 0.24},${-H * 0.67}`} fill="#ffffff" opacity={0.9} />
      {/* Ridge detail */}
      <line x1={-W * 0.4} y1={-H * 0.42} x2={-W * 0.6} y2={-H * 0.22} stroke="rgba(255,255,255,0.15)" strokeWidth={0.8} />
    </g>
  );
}

function Flower({ x, y, s = 1, color = '#e060a0' }: { x: number; y: number; s?: number; color?: string }) {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {angles.map((a, i) => (
        <ellipse
          key={i}
          cx={Math.cos((a * Math.PI) / 180) * 5.5}
          cy={Math.sin((a * Math.PI) / 180) * 5.5}
          rx={4} ry={2.2}
          fill={i % 2 === 0 ? color : color + 'cc'}
          transform={`rotate(${a},${Math.cos((a * Math.PI) / 180) * 5.5},${Math.sin((a * Math.PI) / 180) * 5.5})`}
        />
      ))}
      <circle cx={0} cy={0} r={3.5} fill="#f5d020" />
    </g>
  );
}

function Building({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-10} y={-26} width={10} height={26} fill="#8892a8" />
      <rect x={1} y={-18} width={8} height={18} fill="#9aa4bc" />
      <rect x={-7} y={-32} width={4} height={6} fill="#8892a8" />
      {([[-9, -24], [-9, -17], [-9, -10], [2, -16], [2, -9]] as [number,number][]).map(([wx, wy], i) => (
        <rect key={i} x={wx} y={wy} width={3} height={4} fill="#c8d4f0" opacity={0.9} />
      ))}
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={0.55}>
      <ellipse cx={0} cy={0} rx={20} ry={9} fill="rgba(255,255,255,0.2)" />
      <ellipse cx={-13} cy={3} rx={14} ry={8} fill="rgba(255,255,255,0.18)" />
      <ellipse cx={14} cy={4} rx={12} ry={7} fill="rgba(255,255,255,0.18)" />
    </g>
  );
}

function Star({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * Math.PI / 180;
    const b = (i * 72 - 90 + 36) * Math.PI / 180;
    const r1 = 8 * (s || 1), r2 = 3.5 * (s || 1);
    return `${Math.cos(a)*r1},${Math.sin(a)*r1} ${Math.cos(b)*r2},${Math.sin(b)*r2}`;
  }).join(' ');
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={pts} fill="#f5d020" opacity={0.85} />
    </g>
  );
}

// ─── Island definitions ───────────────────────────────────────────────────────
interface DecoItem {
  type: 'pine' | 'palm' | 'mountain' | 'mountainLarge' | 'flower' | 'building' | 'cloud' | 'star';
  dx: number; dy: number; s?: number; color?: string;
}

interface IslandDef {
  stopId: string;
  cx: number; cy: number;
  offsets: Array<[number, number]>;
  topLight: string;
  topDark: string;
  cliffColor: string;
  cliffDepth: number;
  decos: DecoItem[];
  labelDy: number;
  iconSrc?: string;
  description: string;
  hint: string;
}

const ISLAND_DEFS: IslandDef[] = [
  {
    // 1 — Supía: lush highland, bottom-left (start)
    stopId: 'supia',
    cx: 120, cy: 490,
    offsets: [[-68,12],[-55,-28],[-22,-52],[22,-56],[60,-38],[78,-6],[68,26],[34,42],[-16,44],[-52,30]],
    topLight: '#7ac86a', topDark: '#52a248',
    cliffColor: '#7a6c50', cliffDepth: 32,
    decos: [
      { type: 'mountainLarge', dx: -10, dy: -48, s: 1.0 },
      { type: 'mountain', dx: -36, dy: -32, s: 0.85 },
      { type: 'mountain', dx: 30, dy: -36, s: 0.75 },
      { type: 'pine', dx: -52, dy: -22, s: 1.2 },
      { type: 'pine', dx: 52, dy: -22 },
    ],
    labelDy: -68,
    iconSrc: '/supia.png',
    description: 'Tierra de montañas doradas y café que perfuma el alma. Donde el río Cauca guarda los mejores secretos entre sus orillas.',
    hint: '¿Qué lugar del mundo huele a hogar aunque estés lejos? 🌄',
  },
  {
    // 2 — Medayork: city island, up-right
    stopId: 'medayork',
    cx: 275, cy: 360,
    offsets: [[-62,10],[-50,-30],[-18,-54],[24,-60],[62,-42],[74,-8],[64,22],[30,38],[-14,42],[-50,28]],
    topLight: '#6a8acc', topDark: '#4a6898',
    cliffColor: '#485870', cliffDepth: 30,
    decos: [
      { type: 'building', dx: -22, dy: -44, s: 1.2 },
      { type: 'building', dx: 14, dy: -50, s: 1.4 },
      { type: 'building', dx: -48, dy: -28, s: 0.9 },
      { type: 'flower', dx: 44, dy: -24, s: 1.3, color: '#e080ff' },
      { type: 'flower', dx: -42, dy: -14, s: 1.1, color: '#ff80a0' },
    ],
    labelDy: -70,
    iconSrc: '/sorpresa.webp',
    description: 'Ciudad entre dos mundos: la magia eterna de Medellín y la energía sin límites de Nueva York. Aquí el cielo no tiene techo.',
    hint: '¿Qué ciudad te hizo sentir que todo es posible? 🌆',
  },
  {
    // 3 — La Estrella: golden star island, center
    stopId: 'laestrella',
    cx: 430, cy: 240,
    offsets: [[-66,10],[-54,-32],[-20,-56],[26,-62],[64,-44],[76,-8],[66,24],[32,40],[-12,44],[-52,28]],
    topLight: '#c8b040', topDark: '#9a8024',
    cliffColor: '#806a30', cliffDepth: 28,
    decos: [
      { type: 'star', dx: 0, dy: -46, s: 2.2 },
      { type: 'flower', dx: -38, dy: -30, s: 1.4, color: '#ffd700' },
      { type: 'flower', dx: 34, dy: -28, s: 1.3, color: '#ffd700' },
      { type: 'flower', dx: -10, dy: -24, s: 1.0, color: '#ffaa00' },
      { type: 'pine', dx: -54, dy: -20 },
      { type: 'pine', dx: 52, dy: -18, s: 0.9 },
    ],
    labelDy: -72,
    iconSrc: '/house.png',
    description: 'Un lugar que lleva tu destino en el nombre. Brillante, especial, irrepetible. La estrella que ilumina este camino eres tú.',
    hint: '¿Cuántas estrellas hacen falta para saber que eres única? ⭐',
  },
  {
    // 4 — De nuevo Medayork: urban again, near top-center
    stopId: 'medayork2',
    cx: 585, cy: 148,
    offsets: [[-60,8],[-48,-32],[-16,-56],[24,-60],[60,-42],[72,-6],[62,22],[28,38],[-10,40],[-48,26]],
    topLight: '#7898cc', topDark: '#5878a8',
    cliffColor: '#4a6070', cliffDepth: 28,
    decos: [
      { type: 'building', dx: 4, dy: -46, s: 1.3 },
      { type: 'building', dx: -30, dy: -34, s: 1.0 },
      { type: 'building', dx: 34, dy: -32, s: 0.9 },
      { type: 'flower', dx: -50, dy: -18, s: 1.2, color: '#c060ff' },
      { type: 'flower', dx: 50, dy: -16, s: 1.0, color: '#80c0ff' },
      { type: 'cloud', dx: -20, dy: -60, s: 0.9 },
    ],
    labelDy: -70,
    iconSrc: '/sorpresa.webp',
    description: 'Los mejores lugares siempre merecen una segunda visita. Esta ciudad te extrañaba. Todo se siente diferente cuando ya lo conoces.',
    hint: '¿Qué tan lejos llegarías por volver a sentirte en casa? 🏙️',
  },
  {
    // 5 — Un lugar muy lejano: mysterious dark island, slightly lower before ocean
    stopId: 'lejano',
    cx: 738, cy: 268,
    offsets: [[-64,12],[-52,-28],[-18,-50],[24,-54],[62,-36],[74,-2],[64,26],[30,40],[-12,44],[-52,30]],
    topLight: '#4a6880', topDark: '#2a4860',
    cliffColor: '#3a4858', cliffDepth: 30,
    decos: [
      { type: 'cloud', dx: -20, dy: -56, s: 1.2 },
      { type: 'cloud', dx: 18, dy: -52, s: 1.0 },
      { type: 'mountain', dx: -30, dy: -40, s: 1.0 },
      { type: 'mountain', dx: 24, dy: -38, s: 0.9 },
      { type: 'star', dx: -44, dy: -32, s: 1.2 },
      { type: 'star', dx: 44, dy: -28, s: 1.0 },
    ],
    labelDy: -66,
    iconSrc: '/far.png',
    description: 'Más allá del horizonte, donde el tiempo se dobla y los sueños se vuelven reales. Tan lejos... y sin embargo, tan cerca del corazón.',
    hint: 'La distancia es solo un número cuando el amor no tiene fronteras. 🌌',
  },
  {
    // 6 — Inglaterra: castle island, upper-right (final destination)
    stopId: 'inglaterra',
    cx: 878, cy: 142,
    offsets: [[-64,10],[-52,-28],[-22,-50],[20,-56],[56,-38],[72,-4],[64,22],[30,36],[-10,40],[-48,28]],
    topLight: '#7090a0', topDark: '#506878',
    cliffColor: '#506070', cliffDepth: 30,
    decos: [
      { type: 'mountain', dx: -38, dy: -30, s: 0.9 },
      { type: 'pine', dx: -56, dy: -22, s: 1.1 },
      { type: 'pine', dx: 52, dy: -24 },
      { type: 'cloud', dx: 22, dy: -52, s: 0.85 },
    ],
    labelDy: -68,
    iconSrc: '/castle.png',
    description: 'Entre castillos de piedra y lluvia plateada, un corazón espera el abrazo más largo del mundo. El destino final de esta aventura.',
    hint: '¿A cuántos kilómetros de distancia puede sentirse el amor? 🏰',
  },
];

const PATH_ORDER = ['supia', 'medayork', 'laestrella', 'medayork2', 'lejano', 'inglaterra'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function px(coord: number, base: number, size: number) {
  return `${((coord - base) / size) * 100}%`;
}

function stopProgress(stop: StopConfig, solvedIds: Set<string>) {
  const total = stop.challenges.length || 1;
  const solved = stop.challenges.filter((c) => solvedIds.has(c.id)).length;
  return { solved, total, percent: (solved / total) * 100 };
}

function stopDisplayName(stop: StopConfig, solvedIds: Set<string>) {
  const { percent } = stopProgress(stop, solvedIds);
  if (stop.hiddenName && percent < (stop.revealNameAtPercent ?? 30)) return '???';
  return stop.title;
}

// ─── Island SVG component ─────────────────────────────────────────────────────
function Island({ def, completed }: { def: IslandDef; completed: boolean }) {
  const { cx, cy, offsets, topLight, topDark, cliffColor, cliffDepth, decos } = def;
  const id = `island-grad-${def.stopId}`;

  const topPoints = offsets.map(([dx, dy]) => `${cx + dx},${cy + dy}`).join(' ');
  const cliffPoints = [
    ...offsets.map(([dx, dy]) => `${cx + dx},${cy + dy}`),
    ...offsets.slice().reverse().map(([dx, dy]) => `${cx + dx},${cy + dy + cliffDepth}`),
  ].join(' ');

  const shorePoints = offsets.slice(5).concat(offsets.slice(0, 2))
    .map(([dx, dy]) => `${cx + dx},${cy + dy}`).join(' ');

  return (
    <g>
      <defs>
        <radialGradient id={id} cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor={topLight} />
          <stop offset="100%" stopColor={topDark} />
        </radialGradient>
      </defs>

      {/* Shadow beneath cliff */}
      <ellipse cx={cx + 4} cy={cy + cliffDepth + 8} rx={68} ry={12} fill="rgba(0,0,0,0.25)" />

      {/* Cliff / depth */}
      <polygon points={cliffPoints} fill={cliffColor} opacity={0.92} />
      {/* Cliff highlight edge */}
      <polyline
        points={offsets.map(([dx, dy]) => `${cx + dx},${cy + dy}`).join(' ')}
        fill="none"
        stroke={`rgba(255,255,255,0.12)`}
        strokeWidth={1}
      />

      {/* Top surface */}
      <polygon points={topPoints} fill={`url(#${id})`} />

      {/* Shore highlight */}
      <polyline points={shorePoints} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={2.5} strokeLinejoin="round" />

      {/* Completion glow */}
      {completed && (
        <polygon points={topPoints} fill="rgba(255,220,100,0.25)" stroke="rgba(255,220,100,0.6)" strokeWidth={2.5} />
      )}

      {/* Terrain decorations */}
      {decos.map((d, i) => {
        const ax = cx + d.dx, ay = cy + d.dy;
        switch (d.type) {
          case 'pine': return <Pine key={i} x={ax} y={ay} s={d.s} />;
          case 'palm': return <Palm key={i} x={ax} y={ay} s={d.s} />;
          case 'mountain': return <MountainPeak key={i} x={ax} y={ay} s={d.s} />;
          case 'mountainLarge': return <MountainLarge key={i} x={ax} y={ay} s={d.s} />;
          case 'flower': return <Flower key={i} x={ax} y={ay} s={d.s} color={d.color} />;
          case 'building': return <Building key={i} x={ax} y={ay} s={d.s} />;
          case 'cloud': return <Cloud key={i} x={ax} y={ay} s={d.s} />;
          case 'star': return <Star key={i} x={ax} y={ay} s={d.s} />;
        }
      })}
    </g>
  );
}

// ─── Challenge media component ────────────────────────────────────────────────
function ChallengeMedia({
  challenge, viewed, onViewed,
}: {
  challenge: StopChallengeConfig; viewed: boolean; onViewed: () => void;
}) {
  if (challenge.media.type === 'video' && challenge.media.src) {
    return (
      <div style={{ marginTop: 14, borderRadius: 12, overflow: 'hidden', background: '#000' }}>
        <VideoPlayer
          src={challenge.media.src}
          title={challenge.media.label ?? challenge.title}
          onFinished={onViewed}
          compact
        />
      </div>
    );
  }

  if (challenge.media.type === 'image' && challenge.media.src) {
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img
            src={challenge.media.src}
            alt={challenge.media.label ?? challenge.title}
            style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
          />
        </div>
        <button
          className="btn-rose-vivid"
          style={{ marginTop: 12, width: '100%' }}
          onClick={onViewed}
          disabled={viewed}
        >
          {viewed ? 'Imagen vista ✓' : 'Marcar imagen como vista'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface-mid)' }}>
      <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>📞 Llamada desbloqueada</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
        Esta parada activa la llamada especial.
      </p>
      <button className="btn-rose-vivid" style={{ width: '100%' }} onClick={onViewed} disabled={viewed}>
        {viewed ? 'Llamada marcada ✓' : 'Marcar llamada como completada'}
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function NodeModal({
  stop,
  solvedChallengeIds,
  viewedMediaIds,
  onChallengeSolved,
  onMediaViewed,
  onClose,
}: {
  stop: StopConfig;
  solvedChallengeIds: Set<string>;
  viewedMediaIds: Set<string>;
  onChallengeSolved: (id: string) => void;
  onMediaViewed: (id: string) => void;
  onClose: () => void;
}) {
  const firstUnsolved = stop.challenges.find((c) => !solvedChallengeIds.has(c.id));
  const [activeChallengeId, setActiveChallengeId] = useState<string>(
    firstUnsolved?.id ?? stop.challenges[0]?.id ?? ''
  );

  const activeChallenge = stop.challenges.find((c) => c.id === activeChallengeId) ?? stop.challenges[0];
  const solved = solvedChallengeIds.has(activeChallenge.id);
  const viewed = viewedMediaIds.has(activeChallenge.id);
  const displayName = stopDisplayName(stop, solvedChallengeIds);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10, 8, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 480,
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>{stop.emoji}</span>
          <div style={{ flex: 1 }}>
            <h3 className="serif" style={{ fontSize: 20, color: 'var(--text)', margin: 0 }}>
              {displayName}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {stop.challenges.filter((c) => solvedChallengeIds.has(c.id)).length}/{stop.challenges.length} acertijos
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Challenge tabs */}
        {stop.challenges.length > 1 && (
          <div style={{ padding: '10px 20px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
            {stop.challenges.map((c, idx) => {
              const isSolved = solvedChallengeIds.has(c.id);
              const isViewed = viewedMediaIds.has(c.id);
              const isActive = c.id === activeChallengeId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveChallengeId(c.id)}
                  style={{
                    borderRadius: 999,
                    border: isActive ? '1.5px solid var(--rose)' : '1px solid var(--border)',
                    background: isActive ? 'rgba(158, 86, 100, 0.12)' : 'transparent',
                    padding: '5px 12px',
                    fontSize: 12,
                    color: isActive ? 'var(--rose)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  #{idx + 1} {isSolved ? (isViewed ? '✓' : '🔓') : '🔒'}
                </button>
              );
            })}
          </div>
        )}

        {/* Challenge content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChallenge.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ padding: '0 20px 20px' }}
          >
            {!solved ? (
              <div style={{ paddingTop: 4 }}>
                <RiddleScreen
                  riddle={activeChallenge.riddle}
                  title={activeChallenge.title}
                  compact
                  onSolved={() => onChallengeSolved(activeChallenge.id)}
                />
              </div>
            ) : (
              <div style={{ paddingTop: 16 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--rose)', marginBottom: 4, opacity: 0.7 }}>
                  {activeChallenge.title}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
                  🎁 Premio desbloqueado: {activeChallenge.media.label ?? activeChallenge.media.type}
                </p>
                <ChallengeMedia
                  challenge={activeChallenge}
                  viewed={viewed}
                  onViewed={() => onMediaViewed(activeChallenge.id)}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  stops: StopConfig[];
  solvedChallengeIds: Set<string>;
  viewedMediaIds: Set<string>;
  selectedStopId: string | null;
  allCompleted: boolean;
  onSelectStop: (stop: StopConfig) => void;
  onChallengeSolved: (challengeId: string) => void;
  onMediaViewed: (challengeId: string) => void;
  onFinalClick: () => void;
  finalTitle: string;
  finalEmoji: string;
}

// ─── MapView ──────────────────────────────────────────────────────────────────
export default function MapView({
  stops,
  solvedChallengeIds,
  viewedMediaIds,
  selectedStopId,
  allCompleted,
  onSelectStop,
  onChallengeSolved,
  onMediaViewed,
  onFinalClick,
  finalTitle,
  finalEmoji,
}: Props) {
  const modalStop = selectedStopId ? stops.find((s) => s.id === selectedStopId) ?? null : null;
  const [hoverStopId, setHoverStopId] = useState<string | null>(null);

  const islandMap = useMemo(() => {
    const m = new Map<string, IslandDef>();
    ISLAND_DEFS.forEach((d) => m.set(d.stopId, d));
    return m;
  }, []);

  const pathSegments = useMemo(() => {
    const segs: Array<{ d: string; unlocked: boolean; ocean?: boolean }> = [];
    for (let i = 0; i < PATH_ORDER.length - 1; i++) {
      const a = islandMap.get(PATH_ORDER[i]);
      const b = islandMap.get(PATH_ORDER[i + 1]);
      if (!a || !b) continue;
      const mx = (a.cx + b.cx) / 2;
      const isOcean = PATH_ORDER[i] === 'lejano' && PATH_ORDER[i + 1] === 'inglaterra';
      const my = (a.cy + b.cy) / 2 - (isOcean ? 90 : 32);
      const d = `M ${a.cx},${a.cy} Q ${mx},${my} ${b.cx},${b.cy}`;
      const stopA = stops.find((s) => s.id === PATH_ORDER[i]);
      const unlocked = stopA ? stopA.challenges.some((c) => solvedChallengeIds.has(c.id)) : false;
      segs.push({ d, unlocked, ocean: isOcean });
    }
    return segs;
  }, [islandMap, stops, solvedChallengeIds]);

  const hoveredDef = hoverStopId ? ISLAND_DEFS.find(d => d.stopId === hoverStopId) : null;

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', position: 'relative', background: '#0a1520' }}>

      {/* ── SVG map ── */}
      <div
        style={{
          position: 'absolute', inset: 0,
          aspectRatio: `${VBW} / ${VBH}`,
          maxWidth: '100%',
          maxHeight: '100%',
          margin: 'auto',
        }}
      >
        <svg
          viewBox={`${VBX} ${VBY} ${VBW} ${VBH}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* Deep ocean gradient */}
            <radialGradient id="ocean-grad" cx="45%" cy="55%" r="75%">
              <stop offset="0%" stopColor="#1e4a72" />
              <stop offset="50%" stopColor="#122840" />
              <stop offset="100%" stopColor="#081420" />
            </radialGradient>
            {/* Animated wave pattern */}
            <pattern id="wave-pat" x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
              <path d="M 0 25 Q 25 12 50 25 Q 75 38 100 25" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.8" />
              <path d="M 0 38 Q 25 26 50 38 Q 75 50 100 38" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.2" />
            </pattern>
            <pattern id="wave-pat2" x="0" y="0" width="60" height="30" patternUnits="userSpaceOnUse">
              <path d="M 0 15 Q 15 8 30 15 Q 45 22 60 15" fill="none" stroke="rgba(100,180,255,0.04)" strokeWidth="1.2" />
            </pattern>
          </defs>

          {/* Ocean base */}
          <rect x={VBX} y={VBY} width={VBW} height={VBH} fill="url(#ocean-grad)" />
          <rect x={VBX} y={VBY} width={VBW} height={VBH} fill="url(#wave-pat)" />
          <rect x={VBX} y={VBY} width={VBW} height={VBH} fill="url(#wave-pat2)" />

          {/* Depth shimmer — ocean glints */}
          {[
            [40,60],[160,130],[310,70],[470,180],[620,80],[780,150],[910,70],
            [90,310],[260,400],[440,280],[600,360],[760,280],[890,320],
            [170,510],[390,460],[550,540],[730,500],[880,470],
            [220,200],[500,100],[700,190],[850,230],
          ].map(([wx, wy], i) => (
            <circle key={i} cx={wx} cy={wy} r={i % 4 === 0 ? 2.5 : 1.5}
              fill={`rgba(${120 + (i % 3)*20},${180 + (i % 5)*10},255,${0.06 + (i % 4)*0.02})`} />
          ))}

          {/* Animated wave lines in ocean area */}
          {[80, 160, 240, 340, 430, 520].map((y, i) => (
            <path
              key={`wave-${i}`}
              d={`M ${VBX} ${y} Q ${VBX + 160} ${y - 12} ${VBX + 320} ${y} Q ${VBX + 480} ${y + 12} ${VBX + 640} ${y} Q ${VBX + 800} ${y - 10} ${VBX + VBW} ${y}`}
              fill="none"
              stroke={`rgba(${100 + i*10},${160 + i*8},255,0.06)`}
              strokeWidth={1.5}
            >
              <animate attributeName="stroke-opacity" values="0.06;0.14;0.06" dur={`${4 + i*0.8}s`} repeatCount="indefinite" />
            </path>
          ))}

          {/* Dashed paths between islands */}
          {pathSegments.map((seg, i) => (
            <g key={i}>
              {/* Glow under path */}
              <path
                d={seg.d}
                fill="none"
                stroke={seg.ocean ? 'rgba(80,160,255,0.15)' : 'rgba(255,255,255,0.08)'}
                strokeWidth={seg.unlocked ? 8 : 6}
                strokeLinecap="round"
              />
              <path
                d={seg.d}
                fill="none"
                stroke={seg.ocean
                  ? (seg.unlocked ? 'rgba(100,200,255,0.7)' : 'rgba(100,200,255,0.22)')
                  : (seg.unlocked ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)')
                }
                strokeWidth={seg.unlocked ? 2.5 : 2}
                strokeDasharray={seg.ocean
                  ? (seg.unlocked ? '5 9' : '3 11')
                  : (seg.unlocked ? '12 7' : '7 9')
                }
                strokeLinecap="round"
              />
              {/* Animated dot on unlocked paths */}
              {seg.unlocked && (
                <circle r={4} fill={seg.ocean ? 'rgba(100,200,255,0.8)' : 'rgba(255,255,255,0.8)'}>
                  <animateMotion dur={`${seg.ocean ? 4 : 3}s`} repeatCount="indefinite" path={seg.d} />
                </circle>
              )}
              {seg.ocean && (
                <text x="808" y="120" textAnchor="middle" fontSize={10} fill="rgba(120,200,255,0.4)"
                  fontStyle="italic" letterSpacing="0.1em">
                  Océano Atlántico
                </text>
              )}
            </g>
          ))}

          {/* Islands — always render all, final island (no matching stop) shows as locked */}
          {ISLAND_DEFS.map((def) => {
            const stop = stops.find((s) => s.id === def.stopId);
            const completed = stop ? stopProgress(stop, solvedChallengeIds).solved === stopProgress(stop, solvedChallengeIds).total : false;
            return <Island key={def.stopId} def={def} completed={completed} />;
          })}

          {/* Island labels */}
          {ISLAND_DEFS.map((def) => {
            const stop = stops.find((s) => s.id === def.stopId);
            const isFinal = def.stopId === 'inglaterra';
            const name = stop ? stopDisplayName(stop, solvedChallengeIds) : (isFinal ? finalTitle : '???');
            const solved = stop ? stopProgress(stop, solvedChallengeIds).solved : 0;
            const total = stop ? stopProgress(stop, solvedChallengeIds).total : 0;
            return (
              <g key={`label-${def.stopId}`}>
                <text
                  x={def.cx}
                  y={def.cy + def.labelDy - 6}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={700}
                  fill={isFinal && !stop ? 'rgba(212,168,64,0.9)' : 'rgba(255,255,255,0.92)'}
                  style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }}
                >
                  {name}
                </text>
                {stop && (
                  <text
                    x={def.cx}
                    y={def.cy + def.labelDy + 10}
                    textAnchor="middle"
                    fontSize={10}
                    fill="rgba(255,255,255,0.5)"
                  >
                    {solved}/{total}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── HTML button overlays ── */}
        {ISLAND_DEFS.map((def) => {
          const stop = stops.find((s) => s.id === def.stopId);
          const isFinalIsland = def.stopId === 'inglaterra';
          const btnSize = 68;

          // Final island (no stop entry) — special locked/unlocked button
          if (!stop) {
            return (
              <div
                key={def.stopId}
                style={{
                  position: 'absolute',
                  left: `calc(${px(def.cx, VBX, VBW)} - ${btnSize / 2}px)`,
                  top: `calc(${px(def.cy, VBY, VBH)} - ${btnSize / 2}px)`,
                }}
                onMouseEnter={() => setHoverStopId(def.stopId)}
                onMouseLeave={() => setHoverStopId(null)}
              >
                <button
                  onClick={allCompleted ? onFinalClick : undefined}
                  style={{
                    width: btnSize, height: btnSize,
                    borderRadius: '50%',
                    border: allCompleted ? '2.5px solid rgba(212,168,64,0.9)' : '2px solid rgba(255,255,255,0.25)',
                    background: allCompleted ? 'rgba(212,168,64,0.15)' : 'rgba(8,14,24,0.55)',
                    cursor: allCompleted ? 'pointer' : 'default',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(6px)',
                    boxShadow: allCompleted ? '0 0 28px rgba(212,168,64,0.55)' : '0 3px 12px rgba(0,0,0,0.5)',
                    transition: 'all 0.3s',
                    outline: 'none', position: 'relative',
                    filter: allCompleted ? 'none' : 'grayscale(0.4) opacity(0.7)',
                  }}
                >
                  {def.iconSrc
                    ? <img src={def.iconSrc} style={{ width: 48, height: 48, objectFit: 'contain', pointerEvents: 'none' }} />
                    : <span style={{ fontSize: 28 }}>{finalEmoji}</span>
                  }
                  {/* Progress ring */}
                  <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox={`0 0 ${btnSize} ${btnSize}`} width={btnSize} height={btnSize}>
                    <circle cx={btnSize/2} cy={btnSize/2} r={btnSize/2-3} fill="none" stroke={allCompleted ? 'rgba(212,168,64,0.5)' : 'rgba(255,255,255,0.1)'} strokeWidth={3} />
                  </svg>
                </button>
              </div>
            );
          }

          const { solved, total, percent } = stopProgress(stop, solvedChallengeIds);
          const allViewed = stop.challenges.every((c) => viewedMediaIds.has(c.id));
          const isSelected = selectedStopId === def.stopId;

          return (
            <div
              key={def.stopId}
              style={{
                position: 'absolute',
                left: `calc(${px(def.cx, VBX, VBW)} - ${btnSize / 2}px)`,
                top: `calc(${px(def.cy, VBY, VBH)} - ${btnSize / 2}px)`,
              }}
              onMouseEnter={() => setHoverStopId(def.stopId)}
              onMouseLeave={() => setHoverStopId(null)}
            >
              <button
                onClick={() => onSelectStop(stop)}
                style={{
                  width: btnSize,
                  height: btnSize,
                  borderRadius: '50%',
                  border: allViewed
                    ? '2.5px solid rgba(255,220,100,0.95)'
                    : isSelected
                    ? '2.5px solid rgba(255,255,255,0.95)'
                    : '2px solid rgba(255,255,255,0.35)',
                  background: allViewed
                    ? 'rgba(255,200,60,0.18)'
                    : isSelected
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(8,14,24,0.45)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  backdropFilter: 'blur(5px)',
                  boxShadow: allViewed
                    ? '0 0 24px rgba(255,200,60,0.6)'
                    : isSelected
                    ? '0 0 16px rgba(255,255,255,0.35)'
                    : '0 3px 12px rgba(0,0,0,0.5)',
                  transition: 'all 0.2s',
                  outline: 'none',
                  position: 'relative',
                }}
              >
                {/* Icon image or emoji */}
                {def.iconSrc
                  ? <img src={def.iconSrc} style={{ width: 46, height: 46, objectFit: 'contain', pointerEvents: 'none', borderRadius: '50%' }} />
                  : <span style={{ fontSize: 26, lineHeight: 1 }}>{stop.emoji}</span>
                }
                {/* Solved counter */}
                {total > 0 && (
                  <span style={{
                    position: 'absolute',
                    bottom: 4,
                    fontSize: 9,
                    color: allViewed ? '#ffd060' : 'rgba(255,255,255,0.85)',
                    fontWeight: 700,
                    lineHeight: 1,
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  }}>
                    {solved}/{total}
                  </span>
                )}

                {/* Progress ring */}
                <svg
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                  viewBox={`0 0 ${btnSize} ${btnSize}`}
                  width={btnSize}
                  height={btnSize}
                >
                  <circle
                    cx={btnSize / 2} cy={btnSize / 2} r={btnSize / 2 - 3}
                    fill="none"
                    stroke={allViewed ? 'rgba(255,220,80,0.55)' : 'rgba(255,255,255,0.12)'}
                    strokeWidth={3}
                  />
                  {percent > 0 && (
                    <circle
                      cx={btnSize / 2} cy={btnSize / 2} r={btnSize / 2 - 3}
                      fill="none"
                      stroke={allViewed ? '#ffd060' : 'rgba(255,255,255,0.75)'}
                      strokeWidth={3}
                      strokeDasharray={`${((percent / 100) * 2 * Math.PI * (btnSize / 2 - 3)).toFixed(1)} 999`}
                      strokeLinecap="round"
                      transform={`rotate(-90 ${btnSize / 2} ${btnSize / 2})`}
                    />
                  )}
                </svg>
              </button>
            </div>
          );
        })}

        {/* ── Hover tooltip ── */}
        <AnimatePresence>
          {hoveredDef && (
            <motion.div
              key={hoveredDef.stopId}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'absolute',
                left: px(hoveredDef.cx, VBX, VBW),
                top: `calc(${px(hoveredDef.cy + hoveredDef.labelDy - 28, VBY, VBH)})`,
                transform: 'translate(-50%, -100%)',
                zIndex: 200,
                pointerEvents: 'none',
                width: 220,
              }}
            >
              <div style={{
                background: 'rgba(8,12,22,0.94)',
                border: '1px solid rgba(212,168,64,0.45)',
                borderRadius: 14,
                padding: '14px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,168,64,0.1)',
                backdropFilter: 'blur(12px)',
              }}>
                <p style={{
                  fontSize: 12.5,
                  color: 'rgba(245,232,204,0.92)',
                  lineHeight: 1.65,
                  marginBottom: 10,
                  fontFamily: '"Georgia", serif',
                }}>
                  {hoveredDef.description}
                </p>
                <div style={{
                  borderTop: '1px solid rgba(212,168,64,0.2)',
                  paddingTop: 8,
                }}>
                  <p style={{
                    fontSize: 11,
                    color: 'rgba(212,168,64,0.85)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}>
                    {hoveredDef.hint}
                  </p>
                </div>
                {/* Arrow */}
                <div style={{
                  position: 'absolute',
                  bottom: -7,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 12,
                  height: 7,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    background: 'rgba(8,12,22,0.94)',
                    border: '1px solid rgba(212,168,64,0.45)',
                    transform: 'rotate(45deg)',
                    position: 'absolute',
                    top: -6,
                    left: 0,
                  }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Top header strip ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '10px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(8,12,20,0.92) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <h2 className="serif" style={{ color: 'rgba(255,255,255,0.92)', fontSize: 16, margin: 0 }}>
          🗺️ Mapa del viaje
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
          {stops.reduce((n, s) => n + s.challenges.filter((c) => solvedChallengeIds.has(c.id)).length, 0)}/
          {stops.reduce((n, s) => n + s.challenges.length, 0)} acertijos resueltos
        </p>
      </div>

      {/* ── Final button (when all viewed) ── */}
      <AnimatePresence>
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 50,
            }}
          >
            <button
              className="btn-rose-vivid"
              style={{ padding: '14px 32px', fontSize: 16, boxShadow: '0 4px 24px rgba(158,86,100,0.6)' }}
              onClick={onFinalClick}
            >
              {finalEmoji} {finalTitle}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modalStop && (
          <NodeModal
            stop={modalStop}
            solvedChallengeIds={solvedChallengeIds}
            viewedMediaIds={viewedMediaIds}
            onChallengeSolved={onChallengeSolved}
            onMediaViewed={onMediaViewed}
            onClose={() => onSelectStop(modalStop)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
