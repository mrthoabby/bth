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
  const H = 20 * s, W = 11 * s;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-1.5 * s} y={0} width={3 * s} height={7 * s} fill="#7a5c2e" />
      <polygon points={`0,${-H} ${-W},0 ${W},0`} fill="#2a6b2a" />
      <polygon points={`0,${-H * 0.72} ${-W * 0.8},${-H * 0.25} ${W * 0.8},${-H * 0.25}`} fill="#3a8a3a" />
    </g>
  );
}

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M 0 0 C 3 -7 2 -14 1 -21" stroke="#9b7a1a" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <ellipse cx={-10} cy={-21} rx={9} ry={3} fill="#4db34d" transform="rotate(-20,-10,-21)" />
      <ellipse cx={10} cy={-22} rx={9} ry={3} fill="#4db34d" transform="rotate(20,10,-22)" />
      <ellipse cx={0} cy={-24} rx={7} ry={2.5} fill="#5ec85e" transform="rotate(-5,0,-24)" />
      <ellipse cx={-5} cy={-26} rx={6} ry={2} fill="#3ca03c" transform="rotate(-40,-5,-26)" />
      <ellipse cx={6} cy={-25} rx={6} ry={2} fill="#3ca03c" transform="rotate(35,6,-25)" />
    </g>
  );
}

function MountainPeak({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const H = 24 * s, W = 15 * s;
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={`${-W},0 0,${-H} ${W},0`} fill="#7a8595" />
      <polygon points={`${-W * 0.28},${-H * 0.48} 0,${-H} ${W * 0.28},${-H * 0.48}`} fill="#d8dde8" />
    </g>
  );
}

function Flower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {angles.map((a, i) => (
        <ellipse
          key={i}
          cx={Math.cos((a * Math.PI) / 180) * 5}
          cy={Math.sin((a * Math.PI) / 180) * 5}
          rx={3.5} ry={2}
          fill={i % 2 === 0 ? '#e060a0' : '#f080c0'}
          transform={`rotate(${a},${Math.cos((a * Math.PI) / 180) * 5},${Math.sin((a * Math.PI) / 180) * 5})`}
        />
      ))}
      <circle cx={0} cy={0} r={3} fill="#f5d020" />
    </g>
  );
}

function Castle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-13} y={-24} width={9} height={24} fill="#8090a8" />
      <rect x={4} y={-24} width={9} height={24} fill="#8090a8" />
      {([-13, -10, -7] as number[]).map((bx) => <rect key={bx} x={bx} y={-28} width={2} height={4} fill="#8090a8" />)}
      {([4, 7, 10] as number[]).map((bx) => <rect key={bx} x={bx} y={-28} width={2} height={4} fill="#8090a8" />)}
      <rect x={-4} y={-16} width={8} height={16} fill="#70808e" />
      <rect x={-2} y={-10} width={4} height={10} fill="#4a3a2a" rx={1} />
      <line x1={-8} y1={-24} x2={-8} y2={-33} stroke="#5a4a3a" strokeWidth={1} />
      <polygon points="-8,-33 -3,-30 -8,-27" fill="#cc3030" />
    </g>
  );
}

function Building({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-9} y={-22} width={9} height={22} fill="#909aae" />
      <rect x={1} y={-15} width={7} height={15} fill="#a0aabe" />
      {([[-8, -20], [-8, -14], [-8, -8], [2, -13], [2, -7]] as [number,number][]).map(([wx, wy], i) => (
        <rect key={i} x={wx} y={wy} width={2.5} height={3.5} fill="#d0d8f0" opacity={0.9} />
      ))}
    </g>
  );
}

// ─── Island definitions ───────────────────────────────────────────────────────
interface DecoItem {
  type: 'pine' | 'palm' | 'mountain' | 'flower' | 'castle' | 'building';
  dx: number; dy: number; s?: number;
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
}

const ISLAND_DEFS: IslandDef[] = [
  {
    stopId: 'argentina',
    cx: 118, cy: 490,
    offsets: [[-60,10],[-48,-22],[-18,-42],[20,-47],[55,-32],[70,-4],[60,22],[28,36],[-14,38],[-48,26]],
    topLight: '#6ac05a', topDark: '#4a9840',
    cliffColor: '#7a6c50', cliffDepth: 28,
    decos: [
      { type: 'pine', dx: -30, dy: -36 },
      { type: 'pine', dx: 2, dy: -44, s: 1.1 },
      { type: 'pine', dx: 36, dy: -28 },
    ],
    labelDy: -58,
  },
  {
    stopId: 'supia',
    cx: 290, cy: 335,
    offsets: [[-55,5],[-42,-28],[-10,-52],[28,-55],[58,-38],[65,-8],[52,20],[20,32],[-18,35],[-46,20]],
    topLight: '#8ab870', topDark: '#6a9850',
    cliffColor: '#8a7050', cliffDepth: 30,
    decos: [
      { type: 'mountain', dx: -18, dy: -44 },
      { type: 'mountain', dx: 18, dy: -48, s: 1.2 },
      { type: 'pine', dx: -40, dy: -24 },
    ],
    labelDy: -66,
  },
  {
    stopId: 'medellin',
    cx: 465, cy: 158,
    offsets: [[-62,8],[-50,-26],[-22,-46],[16,-52],[50,-38],[68,-10],[62,18],[34,34],[-8,38],[-46,25]],
    topLight: '#7090b8', topDark: '#506888',
    cliffColor: '#506070', cliffDepth: 26,
    decos: [
      { type: 'building', dx: -18, dy: -36, s: 0.9 },
      { type: 'building', dx: 12, dy: -40, s: 1.1 },
      { type: 'flower', dx: -40, dy: -22, s: 1.2 },
      { type: 'flower', dx: 38, dy: -18, s: 1.0 },
    ],
    labelDy: -64,
  },
  {
    stopId: 'bogota',
    cx: 655, cy: 236,
    offsets: [[-58,6],[-46,-30],[-14,-52],[24,-56],[56,-40],[66,-6],[58,22],[26,36],[-12,38],[-48,24]],
    topLight: '#609068', topDark: '#407048',
    cliffColor: '#6a6050', cliffDepth: 30,
    decos: [
      { type: 'castle', dx: 0, dy: -42 },
      { type: 'building', dx: -32, dy: -28, s: 0.8 },
      { type: 'mountain', dx: 36, dy: -34, s: 0.7 },
    ],
    labelDy: -66,
  },
  {
    stopId: 'carepa',
    cx: 812, cy: 418,
    offsets: [[-60,12],[-48,-24],[-16,-46],[22,-50],[58,-34],[70,-2],[62,24],[30,36],[-12,40],[-50,28]],
    topLight: '#68c880', topDark: '#48a060',
    cliffColor: '#789060', cliffDepth: 26,
    decos: [
      { type: 'palm', dx: -28, dy: -38, s: 1.1 },
      { type: 'palm', dx: 22, dy: -42, s: 1.2 },
      { type: 'palm', dx: -2, dy: -28, s: 0.85 },
    ],
    labelDy: -60,
  },
  {
    stopId: 'inglaterra',
    cx: 615, cy: 498,
    offsets: [[-62,10],[-50,-26],[-20,-46],[18,-52],[52,-36],[68,-6],[60,20],[28,34],[-10,38],[-46,26]],
    topLight: '#8098a8', topDark: '#607080',
    cliffColor: '#5a6070', cliffDepth: 28,
    decos: [
      { type: 'castle', dx: -8, dy: -44, s: 1.2 },
      { type: 'building', dx: 28, dy: -30, s: 0.85 },
      { type: 'pine', dx: -36, dy: -26 },
    ],
    labelDy: -62,
  },
];

const PATH_ORDER = ['argentina','supia','medellin','bogota','carepa','inglaterra'];

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

  // beach edge highlight
  const shorePoints = offsets.slice(5).concat(offsets.slice(0, 2))
    .map(([dx, dy]) => `${cx + dx},${cy + dy}`).join(' ');

  return (
    <g>
      <defs>
        <radialGradient id={id} cx="40%" cy="40%" r="65%">
          <stop offset="0%" stopColor={topLight} />
          <stop offset="100%" stopColor={topDark} />
        </radialGradient>
      </defs>

      {/* cliff / depth */}
      <polygon points={cliffPoints} fill={cliffColor} opacity={0.9} />

      {/* top surface */}
      <polygon points={topPoints} fill={`url(#${id})`} />

      {/* shore highlight */}
      <polyline points={shorePoints} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeLinejoin="round" />

      {/* completion glow */}
      {completed && (
        <polygon points={topPoints} fill="rgba(255,220,100,0.22)" stroke="rgba(255,220,100,0.55)" strokeWidth={2} />
      )}

      {/* terrain decorations */}
      {decos.map((d, i) => {
        const ax = cx + d.dx, ay = cy + d.dy;
        switch (d.type) {
          case 'pine': return <Pine key={i} x={ax} y={ay} s={d.s} />;
          case 'palm': return <Palm key={i} x={ax} y={ay} s={d.s} />;
          case 'mountain': return <MountainPeak key={i} x={ax} y={ay} s={d.s} />;
          case 'flower': return <Flower key={i} x={ax} y={ay} s={d.s} />;
          case 'castle': return <Castle key={i} x={ax} y={ay} s={d.s} />;
          case 'building': return <Building key={i} x={ax} y={ay} s={d.s} />;
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

  // call type
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
        background: 'rgba(10, 8, 20, 0.72)',
        backdropFilter: 'blur(6px)',
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
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
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

  // Build ordered list for path rendering
  const islandMap = useMemo(() => {
    const m = new Map<string, IslandDef>();
    ISLAND_DEFS.forEach((d) => m.set(d.stopId, d));
    return m;
  }, []);

  // Build SVG path segments between adjacent islands
  const pathSegments = useMemo(() => {
    const segs: Array<{ d: string; unlocked: boolean }> = [];
    for (let i = 0; i < PATH_ORDER.length - 1; i++) {
      const a = islandMap.get(PATH_ORDER[i]);
      const b = islandMap.get(PATH_ORDER[i + 1]);
      if (!a || !b) continue;
      const mx = (a.cx + b.cx) / 2;
      const my = (a.cy + b.cy) / 2 - 30;
      const d = `M ${a.cx},${a.cy} Q ${mx},${my} ${b.cx},${b.cy}`;
      const stopA = stops.find((s) => s.id === PATH_ORDER[i]);
      const unlocked = stopA ? stopA.challenges.some((c) => solvedChallengeIds.has(c.id)) : false;
      segs.push({ d, unlocked });
    }
    return segs;
  }, [islandMap, stops, solvedChallengeIds]);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', position: 'relative', background: '#0d1b2a' }}>

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
          {/* Ocean gradient background */}
          <defs>
            <radialGradient id="ocean-grad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1a3a5c" />
              <stop offset="100%" stopColor="#0a1828" />
            </radialGradient>
            {/* Wave pattern */}
            <pattern id="wave-pat" x="0" y="0" width="80" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 20 Q 20 10 40 20 Q 60 30 80 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
            </pattern>
          </defs>

          <rect x={VBX} y={VBY} width={VBW} height={VBH} fill="url(#ocean-grad)" />
          <rect x={VBX} y={VBY} width={VBW} height={VBH} fill="url(#wave-pat)" />

          {/* Subtle ocean shimmer dots */}
          {[
            [50,80],[200,150],[350,80],[500,200],[650,90],[800,160],[900,80],
            [100,350],[280,420],[450,300],[600,380],[750,300],[870,340],
            [180,530],[400,480],[550,560],[720,510],[850,490],
          ].map(([wx, wy], i) => (
            <circle key={i} cx={wx} cy={wy} r={1.5} fill="rgba(255,255,255,0.08)" />
          ))}

          {/* Dashed paths between islands */}
          {pathSegments.map((seg, i) => (
            <path
              key={i}
              d={seg.d}
              fill="none"
              stroke={seg.unlocked ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'}
              strokeWidth={seg.unlocked ? 2.5 : 2}
              strokeDasharray={seg.unlocked ? '10 6' : '6 8'}
              strokeLinecap="round"
            />
          ))}

          {/* Islands */}
          {ISLAND_DEFS.map((def) => {
            const stop = stops.find((s) => s.id === def.stopId);
            if (!stop) return null;
            const { solved, total } = stopProgress(stop, solvedChallengeIds);
            const completed = solved === total;
            return <Island key={def.stopId} def={def} completed={completed} />;
          })}

          {/* Island labels */}
          {ISLAND_DEFS.map((def) => {
            const stop = stops.find((s) => s.id === def.stopId);
            if (!stop) return null;
            const name = stopDisplayName(stop, solvedChallengeIds);
            const { solved, total } = stopProgress(stop, solvedChallengeIds);
            return (
              <g key={`label-${def.stopId}`}>
                <text
                  x={def.cx}
                  y={def.cy + def.labelDy - 4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="rgba(255,255,255,0.9)"
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}
                >
                  {name}
                </text>
                <text
                  x={def.cx}
                  y={def.cy + def.labelDy + 10}
                  textAnchor="middle"
                  fontSize={10}
                  fill="rgba(255,255,255,0.5)"
                >
                  {solved}/{total}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── HTML button overlays ── */}
        {ISLAND_DEFS.map((def) => {
          const stop = stops.find((s) => s.id === def.stopId);
          if (!stop) return null;
          const { solved, total, percent } = stopProgress(stop, solvedChallengeIds);
          const completed = solved === total;
          const allViewed = stop.challenges.every((c) => viewedMediaIds.has(c.id));
          const isSelected = selectedStopId === def.stopId;
          const btnSize = 54;

          return (
            <button
              key={def.stopId}
              onClick={() => onSelectStop(stop)}
              style={{
                position: 'absolute',
                left: `calc(${px(def.cx, VBX, VBW)} - ${btnSize / 2}px)`,
                top: `calc(${px(def.cy, VBY, VBH)} - ${btnSize / 2}px)`,
                width: btnSize,
                height: btnSize,
                borderRadius: '50%',
                border: allViewed
                  ? '2.5px solid rgba(255,220,100,0.9)'
                  : isSelected
                  ? '2.5px solid rgba(255,255,255,0.9)'
                  : '2px solid rgba(255,255,255,0.35)',
                background: allViewed
                  ? 'rgba(255,200,60,0.22)'
                  : isSelected
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(10,18,28,0.55)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                backdropFilter: 'blur(4px)',
                boxShadow: allViewed
                  ? '0 0 16px rgba(255,200,60,0.5)'
                  : isSelected
                  ? '0 0 14px rgba(255,255,255,0.3)'
                  : '0 2px 8px rgba(0,0,0,0.4)',
                transition: 'all 0.2s',
                outline: 'none',
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{stop.emoji}</span>
              {total > 0 && (
                <span style={{
                  fontSize: 9,
                  color: allViewed ? '#ffd060' : 'rgba(255,255,255,0.75)',
                  fontWeight: 700,
                  lineHeight: 1,
                }}>
                  {solved}/{total}
                </span>
              )}

              {/* Progress ring — thin SVG overlay */}
              <svg
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                viewBox="0 0 54 54"
                width={btnSize}
                height={btnSize}
              >
                <circle cx={27} cy={27} r={24}
                  fill="none"
                  stroke={allViewed ? 'rgba(255,220,80,0.55)' : 'rgba(255,255,255,0.12)'}
                  strokeWidth={3}
                />
                {percent > 0 && (
                  <circle cx={27} cy={27} r={24}
                    fill="none"
                    stroke={allViewed ? '#ffd060' : 'rgba(255,255,255,0.7)'}
                    strokeWidth={3}
                    strokeDasharray={`${(percent / 100) * 150.8} 150.8`}
                    strokeLinecap="round"
                    transform="rotate(-90 27 27)"
                  />
                )}
              </svg>
            </button>
          );
        })}
      </div>

      {/* ── Top header strip ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '10px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(10,14,22,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <h2 className="serif" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: 0 }}>
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
