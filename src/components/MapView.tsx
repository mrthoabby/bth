'use client';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StopConfig, StopChallengeConfig } from '@/lib/config';
import RiddleScreen from './RiddleScreen';
import VideoPlayer from './VideoPlayer';
import { playBadge, playUnlock, playWhoosh, playParchmentOpen, playIslandHover, startAmbientMusic, stopAmbientMusic } from '@/lib/sounds';

// ─── ViewBox constants ────────────────────────────────────────────────────────
const VBX = -50, VBY = -50, VBW = 1080, VBH = 690;

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
    cx: 168, cy: 490,
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
    description: 'Donde todo comienza y los orígenes se esconden entre montañas doradas. El primer capítulo de esta historia.',
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
    description: 'En Medayork donde los sueños se hacen realidad. Entre la magia eterna de Medellín y la energía sin límites de Nueva York.',
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
    description: 'La Estrella, donde mi historia tuvo un final... o quizás, donde comenzó lo más bonito de todo.',
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
    description: 'Un lugar muy lejano, un tesoro escondido que solo el corazón más valiente puede encontrar.',
    hint: 'La distancia es solo un número cuando el amor no tiene fronteras. 🌌',
  },
  {
    // 6 — Inglaterra: castle island, near Supia (final destination)
    stopId: 'inglaterra',
    cx: 100, cy: 230,
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
    description: 'Inglaterra, el misterio conocido. Castillos de piedra que guardan el secreto más grande de esta aventura.',
    hint: '¿A cuántos kilómetros de distancia puede sentirse el amor? 🏰',
  },
  {
    // 6 — Carepa: tropical coast island, lower branch from medayork2
    stopId: 'carepa',
    cx: 900, cy: 230,
    offsets: [[-62,10],[-50,-28],[-18,-50],[22,-54],[60,-36],[72,-2],[62,22],[28,38],[-10,42],[-48,28]],
    topLight: '#5aba6a', topDark: '#38904a',
    cliffColor: '#486040', cliffDepth: 28,
    decos: [
      { type: 'palm', dx: -30, dy: -42, s: 1.3 },
      { type: 'palm', dx: 24, dy: -46, s: 1.1 },
      { type: 'flower', dx: -46, dy: -24, s: 1.3, color: '#ff9040' },
      { type: 'flower', dx: 42, dy: -22, s: 1.1, color: '#ffcc00' },
    ],
    labelDy: -66,
    iconSrc: '/carepa.png',
    description: 'Carepa, tierra de historias que el corazón guarda en secreto. Cada video cuenta algo que solo tú puedes descifrar.',
    hint: '¿Qué recuerdo de Carepa te hace sonreír sin razón? 🌿',
  },
  {
    // 7 — Turbo: seaside island, end of lower branch
    stopId: 'turbo',
    cx: 822, cy: 400,
    offsets: [[-60,10],[-48,-28],[-18,-50],[20,-54],[58,-36],[70,-2],[60,22],[26,38],[-8,42],[-46,28]],
    topLight: '#4a80c0', topDark: '#2a5898',
    cliffColor: '#3a4868', cliffDepth: 28,
    decos: [
      { type: 'cloud', dx: -18, dy: -52, s: 1.1 },
      { type: 'cloud', dx: 16, dy: -46, s: 0.9 },
      { type: 'palm', dx: -36, dy: -36, s: 1.2 },
      { type: 'palm', dx: 32, dy: -38, s: 1.0 },
    ],
    labelDy: -64,
    iconSrc: '/turbo.png',
    description: 'Turbo, donde el mar y el horizonte se funden en un abrazo eterno. El último paso antes del gran destino.',
    hint: '¿Qué ves cuando el mar te habla? 🌊',
  },
  {
    // 8 — Enigma I: below lejano
    stopId: 'enigma1',
    cx: 578, cy: 350,
    offsets: [[-54,8],[-44,-26],[-16,-46],[18,-50],[52,-34],[64,-2],[54,18],[22,32],[-10,36],[-42,22]],
    topLight: '#9060cc', topDark: '#6040a0',
    cliffColor: '#503080', cliffDepth: 26,
    decos: [
      { type: 'star', dx: -32, dy: -38, s: 1.3 },
      { type: 'star', dx: 30, dy: -40, s: 1.1 },
      { type: 'flower', dx: 0, dy: -44, s: 1.5, color: '#c878ff' },
      { type: 'flower', dx: -28, dy: -24, s: 1.0, color: '#a050e8' },
      { type: 'flower', dx: 26, dy: -22, s: 0.9, color: '#d090ff' },
    ],
    labelDy: -60,
    iconSrc: '/sorpresa.webp',
    description: 'Una isla cifrada que guarda secretos del alma. Solo quien resuelve sus enigmas puede continuar.',
    hint: '¿Qué tienen en común el agua bendita y los votos eternos? 🗝️',
  },
  {
    // 9 — Enigma II: near Carepa
    stopId: 'enigma2',
    cx: 660, cy: 530,
    offsets: [[-54,8],[-44,-26],[-16,-46],[18,-50],[52,-34],[64,-2],[54,18],[22,32],[-10,36],[-42,22]],
    topLight: '#c89820', topDark: '#a07800',
    cliffColor: '#806010', cliffDepth: 26,
    decos: [
      { type: 'star', dx: -30, dy: -40, s: 1.2 },
      { type: 'star', dx: 28, dy: -38, s: 1.0 },
      { type: 'flower', dx: 0, dy: -46, s: 1.4, color: '#ffd040' },
      { type: 'flower', dx: -26, dy: -26, s: 1.1, color: '#ffb820' },
      { type: 'flower', dx: 24, dy: -24, s: 0.9, color: '#ffe060' },
    ],
    labelDy: -60,
    iconSrc: '/sorpresa.webp',
    description: 'El santuario dorado. Un lugar donde la fe y el amor se encuentran en sus enigmas más profundos.',
    hint: '¿Qué secreto guarda la Palabra entre sus páginas? ✨',
  },
];

const PARIS_DEF: IslandDef = {
  stopId: 'paris',
  cx: 260, cy: 100,
  offsets: [[-60,10],[-48,-28],[-18,-50],[20,-54],[58,-36],[72,-2],[62,22],[28,38],[-8,42],[-46,28]],
  topLight: '#d07898', topDark: '#9a4868',
  cliffColor: '#6a3050', cliffDepth: 28,
  decos: [
    { type: 'flower', dx: 0, dy: -52, s: 2.2, color: '#ff80b0' },
    { type: 'flower', dx: -34, dy: -30, s: 1.4, color: '#ffaac8' },
    { type: 'flower', dx: 34, dy: -28, s: 1.3, color: '#ff6090' },
    { type: 'flower', dx: -12, dy: -22, s: 1.0, color: '#ffd0e0' },
    { type: 'flower', dx: 16, dy: -24, s: 0.9, color: '#ffb8d0' },
  ],
  labelDy: -68,
  description: 'La ciudad del amor eterno. Desde aquí, el corazón hace su llamada más especial. 🗼',
  hint: '¿Desde qué ciudad del mundo soñarías recibir una llamada de amor? 💕',
};

// ── Branching path structure ──────────────────────────────────────────────────
// Dependency map: which stops must be fully solved to unlock each stop
const STOP_DEPS: Record<string, string[]> = {
  supia:      [],
  medayork:   ['supia'],
  laestrella: ['medayork'],
  medayork2:  ['laestrella'],
  carepa:     ['medayork2'],   // lower branch
  lejano:     ['medayork2'],   // upper branch
  turbo:      ['carepa'],
  enigma1:    ['lejano'],      // enigma after lejano (upper path)
  enigma2:    ['turbo'],       // enigma after turbo (lower path)
  // 'inglaterra' is the final destination — uses allCompleted check
};

// Navigation: where onContinue takes you after finishing a stop's last challenge
const NEXT_STOP: Record<string, string | undefined> = {
  supia:      'medayork',
  medayork:   'laestrella',
  laestrella: 'medayork2',
  medayork2:  'carepa',   // main path goes to lower branch first
  carepa:     'turbo',
  turbo:      'enigma2',  // lower path → enigma2 → final
  lejano:     'enigma1',  // upper path → enigma1 → final
  enigma1:    undefined,  // terminal — check if all of Inglaterra's deps done
  enigma2:    undefined,  // terminal — check if all of Inglaterra's deps done
};

// Explicit edges to draw on the map (from → to)
const MAP_EDGES: Array<[string, string]> = [
  ['supia',     'medayork'],
  ['medayork',  'laestrella'],
  ['laestrella','medayork2'],
  ['medayork2', 'carepa'],    // lower branch
  ['carepa',    'turbo'],
  ['turbo',     'enigma2'],
  ['enigma2',   'inglaterra'],
  ['medayork2', 'lejano'],    // upper branch
  ['lejano',    'enigma1'],
  ['enigma1',   'inglaterra'],
];

// Check if all stops that must complete before 'inglaterra' are done
function inglandDepsComplete(stops: StopConfig[], solvedIds: Set<string>): boolean {
  const required = ['enigma1', 'enigma2'];
  return required.every(depId => {
    const dep = stops.find(s => s.id === depId);
    return dep ? dep.challenges.every(c => solvedIds.has(c.id)) : false;
  });
}

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

function isStopAccessible(stopId: string, stops: StopConfig[], solvedIds: Set<string>): boolean {
  const deps = STOP_DEPS[stopId] ?? [];
  return deps.every(depId => {
    const dep = stops.find(s => s.id === depId);
    return dep ? dep.challenges.every(c => solvedIds.has(c.id)) : true;
  });
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

// Sub-component so we can use hooks for image auto-viewed
function ImageMedia({ src, alt, onViewed }: { src: string; alt: string; onViewed: () => void }) {
  // Mark as viewed automatically as soon as the image is shown
  useEffect(() => { onViewed(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#0a0810', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 420 }}>
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </div>
  );
}

function AutoViewed({ onViewed }: { onViewed: () => void }) {
  useEffect(() => { onViewed(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function ChallengeMedia({
  challenge, onViewed, onSurpriseCall, autoPlay = true,
}: {
  challenge: StopChallengeConfig; onViewed: () => void; onSurpriseCall?: () => void; autoPlay?: boolean;
}) {
  if (challenge.media.type === 'video' && challenge.media.src) {
    return (
      <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000' }}>
        <VideoPlayer
          src={challenge.media.src}
          title=""
          onFinished={onViewed}
          compact
          autoPlay={autoPlay}
        />
        {challenge.media.label && (
          <p style={{
            textAlign: 'center',
            color: 'rgba(232,160,180,0.92)',
            fontStyle: 'italic',
            fontSize: 13,
            padding: '6px 16px 14px',
            margin: 0,
            lineHeight: 1.55,
          }}>
            {challenge.media.label}
          </p>
        )}
      </div>
    );
  }

  if (challenge.media.type === 'image' && challenge.media.src) {
    return (
      <div>
        <ImageMedia
          src={challenge.media.src}
          alt={challenge.media.label ?? challenge.title}
          onViewed={onViewed}
        />
        {challenge.media.label && (
          <p style={{
            textAlign: 'center',
            color: 'rgba(232,160,180,0.92)',
            fontStyle: 'italic',
            fontSize: 13,
            padding: '8px 16px 4px',
            margin: 0,
            lineHeight: 1.55,
          }}>
            {challenge.media.label}
          </p>
        )}
      </div>
    );
  }

  if (challenge.media.type === 'call') {
    return <AutoViewed onViewed={() => { onViewed(); onSurpriseCall?.(); }} />;
  }

  return null;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function NodeModal({
  stop,
  solvedChallengeIds,
  onChallengeSolved,
  onMediaViewed,
  onClose,
  onBadgeEarned,
  onSurpriseCall,
  onContinue,
}: {
  stop: StopConfig;
  solvedChallengeIds: Set<string>;
  onChallengeSolved: (id: string) => void;
  onMediaViewed: (id: string) => void;
  onClose: () => void;
  onBadgeEarned: (challengeId: string, label: string) => void;
  onSurpriseCall?: () => void;
  onContinue: () => void;
}) {
  const firstUnsolved = stop.challenges.find((c) => !solvedChallengeIds.has(c.id));
  const [activeChallengeId, setActiveChallengeId] = useState<string>(
    firstUnsolved?.id ?? stop.challenges[0]?.id ?? ''
  );
  // Track which challenge was solved in THIS session (for autoPlay — don't auto-play pre-solved videos)
  const [justSolvedId, setJustSolvedId] = useState<string | null>(null);

  const activeChallenge = stop.challenges.find((c) => c.id === activeChallengeId) ?? stop.challenges[0];
  const solved = solvedChallengeIds.has(activeChallenge.id);
  const displayName = stopDisplayName(stop, solvedChallengeIds);
  const islandIconSrc = ISLAND_DEFS.find((d) => d.stopId === stop.id)?.iconSrc;
  const hasMultiple = stop.challenges.length > 1;

  const activeChallengeIdx = stop.challenges.findIndex((c) => c.id === activeChallengeId);
  const nextChallenge = stop.challenges[activeChallengeIdx + 1];
  const isLastChallenge = !nextChallenge;
  const allSolved = stop.challenges.every((c) => solvedChallengeIds.has(c.id));

  // Challenge N is accessible only if all previous challenges are solved
  const isAccessible = (idx: number) => {
    if (idx === 0) return true;
    return stop.challenges.slice(0, idx).every((c) => solvedChallengeIds.has(c.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
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
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.12 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 1100,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 18px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          {islandIconSrc && (
            <img src={islandIconSrc} alt="" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 24 }}>{stop.emoji}</span>
          <div style={{ flex: 1 }}>
            <h3 className="serif" style={{ fontSize: 18, color: 'var(--text)', margin: 0 }}>
              {displayName}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>

        {/* Body: path sidebar + challenge content */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

          {/* ── Duolingo-style vertical path (only when multiple challenges) ── */}
          {hasMultiple && (
            <div style={{
              width: 100,
              flexShrink: 0,
              borderRight: '1px solid var(--border)',
              padding: '20px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0,
            }}>
              {stop.challenges.map((c, idx) => {
                const isSolved = solvedChallengeIds.has(c.id);
                const accessible = isAccessible(idx);
                const isActive = c.id === activeChallengeId;
                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    {/* Connector line above (except first) */}
                    {idx > 0 && (
                      <div style={{
                        width: 3,
                        height: 20,
                        background: solvedChallengeIds.has(stop.challenges[idx - 1].id)
                          ? 'linear-gradient(to bottom, rgba(215,95,115,0.7), rgba(158,86,100,0.4))'
                          : 'rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        margin: '0 auto',
                      }} />
                    )}

                    {/* Node button */}
                    <motion.button
                      whileHover={accessible ? { scale: 1.08 } : {}}
                      whileTap={accessible ? { scale: 0.94 } : {}}
                      onClick={() => accessible && setActiveChallengeId(c.id)}
                      title={accessible ? c.title : 'Resuelve el anterior primero'}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        border: isActive
                          ? '2.5px solid var(--rose)'
                          : isSolved
                          ? '2px solid rgba(215,95,115,0.5)'
                          : accessible
                          ? '2px solid rgba(255,255,255,0.2)'
                          : '2px solid rgba(255,255,255,0.08)',
                        background: isSolved
                          ? 'linear-gradient(135deg, rgba(175,55,78,0.85), rgba(135,38,58,0.85))'
                          : isActive
                          ? 'rgba(158,86,100,0.2)'
                          : accessible
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.3)',
                        cursor: accessible ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isSolved ? 20 : accessible ? 15 : 18,
                        color: isSolved ? '#fff' : accessible ? 'var(--text)' : 'rgba(255,255,255,0.25)',
                        fontWeight: 700,
                        boxShadow: isActive
                          ? '0 0 0 3px rgba(215,95,115,0.25)'
                          : isSolved
                          ? '0 4px 12px rgba(175,55,78,0.35)'
                          : 'none',
                        transition: 'all 0.15s',
                        outline: 'none',
                      }}
                    >
                      {isSolved ? '✓' : accessible ? `${idx + 1}` : '🔒'}
                    </motion.button>

                    {/* Label */}
                    <p style={{
                      fontSize: 9,
                      textAlign: 'center',
                      color: accessible ? (isActive ? 'var(--rose)' : 'var(--text-muted)') : 'rgba(255,255,255,0.15)',
                      margin: '5px 0 0',
                      lineHeight: 1.3,
                      maxWidth: 80,
                      fontWeight: isActive ? 600 : 400,
                    }}>
                      {c.title}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Active challenge content (riddle + media) ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChallenge.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{ display: 'flex', flexWrap: 'nowrap', flex: 1, minHeight: 0 }}
            >
              {/* Left column — continuar button + riddle */}
              <div style={{
                flex: '0 0 30%',
                padding: '16px 18px',
                borderRight: '1px solid var(--border)',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                <AnimatePresence>
                  {solved && (
                    <motion.div
                      key="continuar-btn"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, delay: 0.15 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          onMediaViewed(activeChallenge.id);
                          if (!isLastChallenge) {
                            setActiveChallengeId(nextChallenge.id);
                          } else if (allSolved) {
                            onContinue();
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '11px 16px',
                          background: 'linear-gradient(135deg, rgba(175,55,78,0.9), rgba(135,38,58,0.9))',
                          border: '1.5px solid rgba(215,95,115,0.5)',
                          borderRadius: 12,
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 4px 18px rgba(175,55,78,0.35)',
                        }}
                      >
                        {isLastChallenge ? '¡Siguiente isla! 🗺️' : 'Continuar →'}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <RiddleScreen
                  riddle={activeChallenge.riddle}
                  title={activeChallenge.title}
                  compact
                  onSolved={() => { playUnlock(); setJustSolvedId(activeChallenge.id); onChallengeSolved(activeChallenge.id); }}
                  onFirstTrySolve={() => onBadgeEarned(activeChallenge.id, activeChallenge.title)}
                />
              </div>

              {/* Right column — media (blurred until solved) */}
              <div style={{
                flex: '0 0 70%',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                minWidth: 0,
                minHeight: 400,
              }}>
                {/* Enigma challenge: show key image un-blurred as context while solving */}
                {!solved && activeChallenge.media.keyImage ? (
                  <div style={{ borderRadius: 12, overflow: 'hidden', background: '#0a0810', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 420 }}>
                    <img
                      src={activeChallenge.media.keyImage}
                      alt="pista"
                      style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <>
                    {/* Regular media — blurred until solved */}
                    <div style={{
                      filter: solved ? 'blur(0px)' : 'blur(36px)',
                      transition: 'filter 0.5s ease',
                      pointerEvents: solved ? 'auto' : 'none',
                      userSelect: solved ? 'auto' : 'none',
                    }}>
                      <ChallengeMedia
                        challenge={activeChallenge}
                        onViewed={() => onMediaViewed(activeChallenge.id)}
                        onSurpriseCall={onSurpriseCall}
                        autoPlay={justSolvedId === activeChallenge.id}
                      />
                    </div>

                    {/* Lock overlay when not yet solved */}
                    {!solved && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 10,
                        background: 'rgba(20, 8, 14, 0.55)',
                        borderRadius: 12,
                      }}>
                        <div style={{
                          background: 'rgba(175, 55, 78, 0.18)',
                          border: '1.5px solid rgba(215,95,115,0.35)',
                          borderRadius: 16,
                          padding: '18px 24px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          backdropFilter: 'blur(4px)',
                        }}>
                          <span style={{ fontSize: 38 }}>🔒</span>
                          <p style={{
                            fontSize: 13,
                            color: 'rgba(255, 200, 210, 0.95)',
                            textAlign: 'center',
                            margin: 0,
                            maxWidth: 160,
                            lineHeight: 1.55,
                            fontWeight: 500,
                          }}>
                            Resuelve el acertijo para descubrir el premio
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>
    </motion.div>
  );
}

// ─── Badge star component ─────────────────────────────────────────────────────
function BadgeStar({ label, index }: { label: string; index: number }) {
  const [hovered, setHovered] = useState(false);
  const palette = ['#ffd700', '#ff6b6b', '#4ecdc4', '#a78bfa', '#f472b6', '#34d399'];
  const color = palette[index % palette.length];
  return (
    <div style={{ position: 'relative' }}>
      <motion.div
        initial={{ scale: 0, rotate: -180, y: 20 }}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18, delay: index * 0.06 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}28, ${color}0a)`,
          border: `1.5px solid ${color}70`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'default',
          boxShadow: `0 0 10px ${color}50`,
        }}
      >
        <span style={{ fontSize: 15 }}>⭐</span>
      </motion.div>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', bottom: 38, left: '50%', transform: 'translateX(-50%)',
              whiteSpace: 'nowrap', background: 'rgba(6,10,20,0.96)',
              border: `1px solid ${color}50`, borderRadius: 8,
              padding: '4px 9px', fontSize: 11, color, zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            ✨ {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  onDeselectStop: () => void;
  onChallengeSolved: (challengeId: string) => void;
  onMediaViewed: (challengeId: string) => void;
  onSurpriseCall?: () => void;
  onFinalClick: () => void;
  onParisClick: () => void;
  finalTitle: string;
  finalEmoji: string;
}

// ─── Map intro parchment ──────────────────────────────────────────────────────
function MapIntroParchment({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => { playParchmentOpen(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4,2,8,0.78)',
        backdropFilter: 'blur(6px)',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.82, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 160, damping: 20 }}
        style={{
          maxWidth: 480, width: '100%',
          background: 'linear-gradient(160deg, #f5ead0 0%, #ede0be 40%, #e5d4aa 100%)',
          borderRadius: 4,
          boxShadow: '0 0 0 1px rgba(120,80,20,0.35), 0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.55)',
          padding: '40px 36px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Parchment texture lines */}
        {[...Array(18)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0,
            top: `${(i + 1) * 5.5}%`, height: 1,
            background: 'rgba(140,90,20,0.07)',
            pointerEvents: 'none',
          }} />
        ))}
        {/* Corner flourishes */}
        <div style={{ position: 'absolute', top: 10, left: 12, fontSize: 18, opacity: 0.35, lineHeight: 1 }}>✦</div>
        <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 18, opacity: 0.35, lineHeight: 1 }}>✦</div>
        <div style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 18, opacity: 0.35, lineHeight: 1 }}>✦</div>
        <div style={{ position: 'absolute', bottom: 10, right: 12, fontSize: 18, opacity: 0.35, lineHeight: 1 }}>✦</div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(100,60,10,0.55)', marginBottom: 8, fontFamily: '"Georgia",serif' }}>
            — Mapa Secreto —
          </p>
          <h2 style={{
            fontFamily: '"Playfair Display","Georgia",serif',
            fontSize: 24, fontWeight: 700,
            color: '#3a1e06', lineHeight: 1.25, margin: 0,
          }}>
            Bienvenida al Archipiélago<br />de Geralduchén 🗺️
          </h2>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1.5px solid rgba(120,80,20,0.25)', marginBottom: 20 }} />

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
          <p style={{ fontSize: 14, color: '#4a2e0e', fontFamily: '"Georgia",serif', lineHeight: 1.75, margin: 0 }}>
            Ante ti se extiende un archipiélago lleno de misterios. <strong>Cada isla guarda un secreto</strong> — resuelve sus enigmas para revelar lo que esconden.
          </p>

          {/* Alerta islas enigma — claves para la isla final */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: 'rgba(140,20,20,0.12)', borderRadius: 10,
            border: '1.5px solid rgba(180,50,40,0.4)', padding: '12px 14px',
          }}>
            <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1.2 }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#7a1e10', fontFamily: '"Georgia",serif', marginBottom: 4 }}>
                ¡Estate muy atenta a las Islas Enigma!
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#5c2010', fontFamily: '"Georgia",serif', lineHeight: 1.65 }}>
                Cada <strong>Isla Enigma</strong> te entregará una <strong>clave secreta</strong> que necesitarás más adelante para poder llegar a la <strong>isla final</strong>. No las pierdas de vista. 🔑
              </p>
            </div>
          </div>

          {/* Legend: isla secreta */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: 'rgba(120,80,20,0.1)', borderRadius: 10,
            border: '1px solid rgba(120,80,20,0.22)', padding: '12px 14px',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2 }}>🔮</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#3a1e06', fontFamily: '"Georgia",serif', marginBottom: 3 }}>
                Isla Secreta
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#5c3612', fontFamily: '"Georgia",serif', lineHeight: 1.6 }}>
                Su nombre se revela a medida que desbloqueas sus enigmas. ¡Descubre qué lugar esconde!
              </p>
            </div>
          </div>

          {/* Legend: isla enigma */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: 'rgba(180,100,20,0.12)', borderRadius: 10,
            border: '1px solid rgba(180,100,20,0.3)', padding: '12px 14px',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2 }}>⚡</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#3a1e06', fontFamily: '"Georgia",serif', marginBottom: 3 }}>
                Isla Enigma
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#5c3612', fontFamily: '"Georgia",serif', lineHeight: 1.6 }}>
                Un reto especial: <strong>guarda bien la clave</strong> que te entrega. La necesitarás para llegar a tu destino final. ¡No hay atajos!
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1.5px solid rgba(120,80,20,0.2)', marginBottom: 18 }} />

        <p style={{ fontSize: 12, color: 'rgba(90,50,10,0.6)', fontStyle: 'italic', fontFamily: '"Georgia",serif', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
          Bienvenida al Archipiélago de Geralduchén.<br />¡Mucho ánimo, exploradora! 🌊
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={onDismiss}
            style={{
              padding: '13px 40px',
              background: 'linear-gradient(135deg, #7a3828, #5a2218)',
              color: '#fdf0d8',
              border: '1px solid rgba(180,80,40,0.5)',
              borderRadius: 3,
              fontSize: 14, fontFamily: '"Georgia",serif', letterSpacing: '0.07em',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(100,30,10,0.4)',
            }}
          >
            ¡Comenzar la aventura! 🗺️
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── MapView ──────────────────────────────────────────────────────────────────
export default function MapView({
  stops,
  solvedChallengeIds,
  viewedMediaIds,
  selectedStopId,
  allCompleted,
  onSelectStop,
  onDeselectStop,
  onChallengeSolved,
  onMediaViewed,
  onSurpriseCall,
  onFinalClick,
  onParisClick,
  finalTitle,
  finalEmoji,
}: Props) {
  const modalStop = selectedStopId ? stops.find((s) => s.id === selectedStopId) ?? null : null;
  const [hoverStopId, setHoverStopId] = useState<string | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Array<{ id: string; label: string }>>([]);
  const [parisRevealed, setParisRevealed] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [gabys, setGabys] = useState(0);
  const [gabyPopup, setGabyPopup] = useState(false);

  const handleBadgeEarned = (id: string, label: string) => {
    setEarnedBadges((prev) => {
      if (prev.some((b) => b.id === id)) return prev;
      playBadge();
      return [...prev, { id, label }];
    });
  };

  const checkIslandGaby = (stop: StopConfig, currentBadges: Array<{ id: string; label: string }>) => {
    const isPerfect = stop.challenges.every(c => currentBadges.some(b => b.id === c.id));
    if (isPerfect) {
      setGabys(g => g + 1);
      setGabyPopup(true);
      setTimeout(() => setGabyPopup(false), 3000);
    }
  };

  // Start ambient music when map mounts, fade out on unmount
  useEffect(() => {
    startAmbientMusic();
    return () => stopAmbientMusic();
  }, []);

  const islandMap = useMemo(() => {
    const m = new Map<string, IslandDef>();
    ISLAND_DEFS.forEach((d) => m.set(d.stopId, d));
    return m;
  }, []);

  const pathSegments = useMemo(() => {
    const segs: Array<{ d: string; unlocked: boolean; ocean?: boolean }> = [];
    for (const [fromId, toId] of MAP_EDGES) {
      const a = islandMap.get(fromId);
      const b = islandMap.get(toId);
      if (!a || !b) continue;
      const mx = (a.cx + b.cx) / 2;
      const isOcean = (fromId === 'lejano' || fromId === 'turbo') && toId === 'inglaterra';
      const my = (a.cy + b.cy) / 2 - (isOcean ? 70 : 32);
      const d = `M ${a.cx},${a.cy} Q ${mx},${my} ${b.cx},${b.cy}`;
      const stopA = stops.find((s) => s.id === fromId);
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
              {/* Animated dot — always visible, brighter when unlocked */}
              <circle
                r={seg.unlocked ? 4 : 2.5}
                fill={seg.ocean
                  ? (seg.unlocked ? 'rgba(100,200,255,0.85)' : 'rgba(100,200,255,0.3)')
                  : (seg.unlocked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)')
                }
              >
                <animateMotion dur={`${seg.ocean ? 5 : 3.5}s`} repeatCount="indefinite" path={seg.d} />
              </circle>
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

          {/* París island — emerges with whoosh after England is clicked */}
          <AnimatePresence>
            {parisRevealed && (() => {
              const def = PARIS_DEF;
              const name = 'París 🗼';
              const pillW = Math.max(name.length * 7.2, 48) + 22;
              const pillH = 20;
              const pillX = def.cx - pillW / 2;
              const pillY = def.cy + def.labelDy - pillH - 4;
              return (
                <motion.g
                  key="paris-island"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 13 }}
                  style={{ transformBox: 'fill-box', transformOrigin: `${def.cx}px ${def.cy}px` }}
                >
                  <Island def={def} completed={false} />
                  {/* Ripple rings */}
                  <circle cx={def.cx} cy={def.cy} r={45} fill="none" stroke="rgba(220,120,170,0.55)" strokeWidth={3}>
                    <animate attributeName="r" values="40;140" dur="1.4s" fill="freeze" />
                    <animate attributeName="opacity" values="0.7;0" dur="1.4s" fill="freeze" />
                  </circle>
                  <circle cx={def.cx} cy={def.cy} r={45} fill="none" stroke="rgba(255,170,210,0.35)" strokeWidth={2}>
                    <animate attributeName="r" values="40;180" dur="1.9s" begin="0.25s" fill="freeze" />
                    <animate attributeName="opacity" values="0.5;0" dur="1.9s" begin="0.25s" fill="freeze" />
                  </circle>
                  {/* Label pill */}
                  <rect x={pillX} y={pillY} width={pillW} height={pillH} rx={10} ry={10}
                    fill="rgba(210,100,155,0.95)"
                    filter="url(#pill-shadow)" />
                  <text x={def.cx} y={pillY + pillH - 6}
                    textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#fff">
                    {name}
                  </text>
                </motion.g>
              );
            })()}
          </AnimatePresence>

          {/* Island labels */}
          {ISLAND_DEFS.map((def) => {
            const stop = stops.find((s) => s.id === def.stopId);
            const isFinal = def.stopId === 'inglaterra';
            const name = stop ? stopDisplayName(stop, solvedChallengeIds) : (isFinal ? finalTitle : '???');
            const { solved, total } = stop ? stopProgress(stop, solvedChallengeIds) : { solved: 0, total: 0 };
            const remaining = total - solved;
            const allDone = stop ? stop.challenges.every((c) => solvedChallengeIds.has(c.id)) : false;

            // estimate pill width based on label length
            const pillW = Math.max(name.length * 7.5, 48) + 22;
            const pillH = 20;
            const pillX = def.cx - pillW / 2;
            const pillY = def.cy + def.labelDy - pillH - 4;

            return (
              <g key={`label-${def.stopId}`}>
                {/* White pill background for title */}
                <rect
                  x={pillX} y={pillY}
                  width={pillW} height={pillH}
                  rx={10} ry={10}
                  fill={isFinal && !stop ? 'rgba(212,168,64,0.95)' : 'rgba(255,255,255,0.93)'}
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))' }}
                />
                <text
                  x={def.cx}
                  y={pillY + pillH - 6}
                  textAnchor="middle"
                  fontSize={11.5}
                  fontWeight={700}
                  fill={isFinal && !stop ? '#3a2000' : '#1a1a2e'}
                >
                  {name}
                </text>

                {/* Lock/progress badge */}
                {stop && (
                  <g transform={`translate(${def.cx + pillW / 2 + 14}, ${pillY + pillH / 2})`}>
                    <circle r={11}
                      fill={allDone ? 'rgba(60,180,80,0.92)' : remaining > 0 ? 'rgba(20,20,40,0.85)' : 'rgba(60,180,80,0.92)'}
                      stroke={allDone ? 'rgba(100,230,120,0.6)' : 'rgba(255,255,255,0.3)'}
                      strokeWidth={1.5}
                    />
                    <text
                      x={0} y={4}
                      textAnchor="middle"
                      fontSize={allDone ? 11 : 9}
                      fontWeight={700}
                      fill="#fff"
                    >
                      {allDone ? '✓' : `🔒${remaining}`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── HTML button overlays ── */}
        {ISLAND_DEFS.map((def) => {
          const stop = stops.find((s) => s.id === def.stopId);
          const iconSize = 170;  // icon overflows beyond ring
          const ringSize = 80;   // circle ring / click-area diameter

          // Final island (no stop entry) — special locked/unlocked button
          if (!stop) {
            return (
              <div
                key={def.stopId}
                role="button"
                tabIndex={0}
                onClick={allCompleted ? () => { if (!parisRevealed) { playWhoosh(); setParisRevealed(true); } else onFinalClick(); } : undefined}
                onMouseEnter={() => { playIslandHover(); setHoverStopId(def.stopId); }}
                onMouseLeave={() => setHoverStopId(null)}
                style={{
                  position: 'absolute',
                  left: `calc(${px(def.cx, VBX, VBW)} - ${iconSize / 2}px)`,
                  top: `calc(${px(def.cy, VBY, VBH)} - ${iconSize / 2 + 40}px)`,
                  width: iconSize, height: iconSize + 40,
                  cursor: allCompleted ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  paddingBottom: 20,
                }}
              >
                {/* Ring circle behind icon — centered on icon */}
                <svg
                  style={{
                    position: 'absolute',
                    top: iconSize + 40 - 20 - iconSize / 2 - ringSize / 2,
                    left: (iconSize - ringSize) / 2,
                    pointerEvents: 'none', zIndex: 1,
                  }}
                  width={ringSize} height={ringSize}
                  viewBox={`0 0 ${ringSize} ${ringSize}`}
                >
                  <circle cx={ringSize/2} cy={ringSize/2} r={ringSize/2-2}
                    fill={allCompleted ? 'rgba(212,168,64,0.15)' : 'rgba(8,14,24,0.55)'}
                    stroke={allCompleted ? 'rgba(212,168,64,0.9)' : 'rgba(255,255,255,0.25)'}
                    strokeWidth={allCompleted ? 2.5 : 2}
                  />
                </svg>
                {/* Glow halo */}
                {allCompleted && (
                  <div style={{
                    position: 'absolute',
                    top: iconSize + 40 - 20 - iconSize / 2 - ringSize / 2,
                    left: (iconSize - ringSize) / 2,
                    width: ringSize, height: ringSize, borderRadius: '50%',
                    boxShadow: '0 0 28px rgba(212,168,64,0.55)', pointerEvents: 'none', zIndex: 0,
                  }} />
                )}
                {/* Icon — larger than ring */}
                {def.iconSrc
                  ? <motion.img src={def.iconSrc} alt=""
                      animate={hoverStopId === def.stopId ? { y: [0, -10, 0, -7, 0, -4, 0] } : { y: 0 }}
                      transition={hoverStopId === def.stopId ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.25 }}
                      style={{
                        width: iconSize, height: iconSize, objectFit: 'contain',
                        pointerEvents: 'none', position: 'relative', zIndex: 2,
                        filter: allCompleted ? 'drop-shadow(0 4px 12px rgba(212,168,64,0.5))' : 'grayscale(0.4) opacity(0.7)',
                      }} />
                  : <span style={{ fontSize: 70, position: 'relative', zIndex: 2 }}>{finalEmoji}</span>
                }
              </div>
            );
          }

          const { solved, total, percent } = stopProgress(stop, solvedChallengeIds);
          const allViewed = stop.challenges.every((c) => viewedMediaIds.has(c.id));
          const isSelected = selectedStopId === def.stopId;
          const accessible = isStopAccessible(def.stopId, stops, solvedChallengeIds);

          return (
            <div
              key={def.stopId}
              role="button"
              tabIndex={accessible ? 0 : -1}
              onClick={() => accessible && onSelectStop(stop)}
              onKeyDown={(e) => e.key === 'Enter' && accessible && onSelectStop(stop)}
              onMouseEnter={() => { playIslandHover(); setHoverStopId(def.stopId); }}
              onMouseLeave={() => setHoverStopId(null)}
              style={{
                position: 'absolute',
                left: `calc(${px(def.cx, VBX, VBW)} - ${iconSize / 2}px)`,
                top: `calc(${px(def.cy, VBY, VBH)} - ${iconSize / 2 + 40}px)`,
                width: iconSize, height: iconSize + 40,
                cursor: accessible ? 'pointer' : 'default',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                paddingBottom: 20,
              }}
            >
              {/* Ring circle — centered behind icon */}
              <svg
                style={{
                  position: 'absolute',
                  top: iconSize + 40 - 20 - iconSize / 2 - ringSize / 2,
                  left: (iconSize - ringSize) / 2,
                  pointerEvents: 'none', zIndex: 1,
                }}
                width={ringSize} height={ringSize}
                viewBox={`0 0 ${ringSize} ${ringSize}`}
              >
                <circle
                  cx={ringSize/2} cy={ringSize/2} r={ringSize/2-2}
                  fill={!accessible ? 'rgba(8,14,24,0.6)' : allViewed ? 'rgba(255,200,60,0.18)' : isSelected ? 'rgba(255,110,20,0.22)' : 'rgba(8,14,24,0.45)'}
                  stroke={!accessible ? 'rgba(255,255,255,0.12)' : allViewed ? 'rgba(255,220,100,0.95)' : isSelected ? 'rgba(255,120,30,0.98)' : 'rgba(255,255,255,0.35)'}
                  strokeWidth={allViewed || isSelected ? 3 : 2}
                />
                {/* Progress track */}
                <circle
                  cx={ringSize/2} cy={ringSize/2} r={ringSize/2-2}
                  fill="none"
                  stroke={allViewed ? 'rgba(255,220,80,0.55)' : 'rgba(255,255,255,0.12)'}
                  strokeWidth={3.5}
                />
                {/* Progress fill */}
                {percent > 0 && (
                  <circle
                    cx={ringSize/2} cy={ringSize/2} r={ringSize/2-2}
                    fill="none"
                    stroke={allViewed ? '#ffd060' : 'rgba(255,255,255,0.75)'}
                    strokeWidth={3.5}
                    strokeDasharray={`${((percent / 100) * 2 * Math.PI * (ringSize/2-2)).toFixed(1)} 999`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${ringSize/2} ${ringSize/2})`}
                  />
                )}
              </svg>

              {/* Glow halo — centered behind icon */}
              <div style={{
                position: 'absolute',
                top: iconSize + 40 - 20 - iconSize / 2 - ringSize / 2,
                left: (iconSize - ringSize) / 2,
                width: ringSize, height: ringSize, borderRadius: '50%',
                boxShadow: allViewed
                  ? '0 0 24px rgba(255,200,60,0.6)'
                  : isSelected
                  ? '0 0 20px rgba(255,110,20,0.65), 0 0 40px rgba(255,80,0,0.25)'
                  : '0 3px 12px rgba(0,0,0,0.5)',
                pointerEvents: 'none', zIndex: 0,
                transition: 'box-shadow 0.2s',
              }} />

              {/* Icon — larger than ring, floats on top */}
              {def.iconSrc
                ? <motion.img src={def.iconSrc} alt=""
                    animate={hoverStopId === def.stopId ? { y: [0, -10, 0, -7, 0, -4, 0] } : { y: 0 }}
                    transition={hoverStopId === def.stopId ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.25 }}
                    style={{
                      width: iconSize, height: iconSize, objectFit: 'contain',
                      pointerEvents: 'none', position: 'relative', zIndex: 2,
                      filter: allViewed
                        ? 'drop-shadow(0 4px 14px rgba(255,200,60,0.55))'
                        : isSelected
                        ? 'drop-shadow(0 3px 10px rgba(255,255,255,0.4))'
                        : 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))',
                    }} />
                : <span style={{ fontSize: 70, lineHeight: 1, position: 'relative', zIndex: 2 }}>{stop.emoji}</span>
              }

              {/* Solved counter badge */}
              {total > 0 && (
                <span style={{
                  position: 'absolute',
                  bottom: (iconSize - ringSize) / 2 - 2,
                  fontSize: 9, fontWeight: 700, lineHeight: 1,
                  color: allViewed ? '#ffd060' : 'rgba(255,255,255,0.85)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                  zIndex: 3, pointerEvents: 'none',
                }}>
                  {solved}/{total}
                </span>
              )}

              {/* Locked overlay — sequential access */}
              {!accessible && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    background: 'rgba(0,0,0,0.55)', borderRadius: '50%',
                    width: ringSize + 8, height: ringSize + 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    🔒
                  </div>
                </div>
              )}
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
                top: `calc(${px(hoveredDef.cy + hoveredDef.labelDy + 22, VBY, VBH)})`,
                transform: 'translate(-50%, 0)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {gabys > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {Array.from({ length: gabys }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14, delay: i * 0.05 }}
                  style={{ fontSize: 18, lineHeight: 1 }}
                >
                  💗
                </motion.span>
              ))}
            </div>
          )}
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
            {stops.reduce((n, s) => n + s.challenges.filter((c) => solvedChallengeIds.has(c.id)).length, 0)}/
            {stops.reduce((n, s) => n + s.challenges.length, 0)} acertijos resueltos
          </p>
        </div>
      </div>

      {/* ── Gaby earned popup ── */}
      <AnimatePresence>
        {gabyPopup && (
          <motion.div
            key="gaby-popup"
            initial={{ opacity: 0, scale: 0.7, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            style={{
              position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)',
              zIndex: 300, pointerEvents: 'none',
              background: 'rgba(6,10,20,0.94)',
              border: '1.5px solid rgba(232,130,170,0.6)',
              borderRadius: 16,
              padding: '12px 22px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: '0 8px 32px rgba(180,60,100,0.4)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <span style={{ fontSize: 28 }}>💗</span>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'rgba(255,200,220,0.95)' }}>
              ¡Gaby desbloqueada!
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(200,160,180,0.8)', textAlign: 'center' }}>
              Isla perfecta — sin errores ✨
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
              onClick={onParisClick}
            >
              {finalEmoji} {finalTitle}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Badge collection strip ── */}
      <AnimatePresence>
        {earnedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              bottom: allCompleted ? 88 : 18,
              left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 6, zIndex: 50,
              padding: '6px 12px',
              background: 'rgba(6,10,20,0.88)',
              borderRadius: 999,
              border: '1px solid rgba(212,168,64,0.3)',
              backdropFilter: 'blur(8px)',
              transition: 'bottom 0.3s',
            }}
          >
            {earnedBadges.map((badge, i) => (
              <BadgeStar key={badge.id} label={badge.label} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── París clickable overlay ── */}
      <AnimatePresence>
        {parisRevealed && (
          <motion.div
            key="paris-btn"
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 13, delay: 0.15 }}
            role="button"
            tabIndex={0}
            onClick={onParisClick}
            onMouseEnter={() => { playIslandHover(); setHoverStopId('paris'); }}
            onMouseLeave={() => setHoverStopId(null)}
            style={{
              position: 'absolute',
              left: `calc(${((PARIS_DEF.cx - VBX) / VBW) * 100}% - 85px)`,
              top: `calc(${((PARIS_DEF.cy - VBY) / VBH) * 100}% - 125px)`,
              width: 170, height: 210,
              cursor: 'pointer',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              paddingBottom: 20,
            }}
          >
            {/* Ring */}
            <svg style={{ position: 'absolute', top: 85, left: 45, pointerEvents: 'none', zIndex: 1 }}
              width={80} height={80} viewBox="0 0 80 80">
              <circle cx={40} cy={40} r={37}
                fill="rgba(210,100,150,0.18)"
                stroke="rgba(220,120,170,0.95)"
                strokeWidth={2.5} />
            </svg>
            {/* Glow */}
            <div style={{
              position: 'absolute', top: 85, left: 45,
              width: 80, height: 80, borderRadius: '50%',
              boxShadow: '0 0 36px rgba(220,100,160,0.7), 0 0 70px rgba(200,80,140,0.3)',
              pointerEvents: 'none', zIndex: 0,
            }} />
            <span style={{ fontSize: 72, lineHeight: 1, position: 'relative', zIndex: 2, filter: 'drop-shadow(0 4px 16px rgba(220,100,160,0.8))' }}>
              🗼
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map intro parchment ── */}
      <AnimatePresence>
        {showIntro && (
          <MapIntroParchment onDismiss={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modalStop && (
          <NodeModal
            key={modalStop.id}
            stop={modalStop}
            solvedChallengeIds={solvedChallengeIds}
            onChallengeSolved={onChallengeSolved}
            onMediaViewed={onMediaViewed}
            onClose={onDeselectStop}
            onBadgeEarned={handleBadgeEarned}
            onSurpriseCall={onSurpriseCall}
            onContinue={() => {
              checkIslandGaby(modalStop, earnedBadges);
              const nextId = NEXT_STOP[modalStop.id];
              const nextStop = nextId ? stops.find((s) => s.id === nextId) : undefined;
              onDeselectStop();
              if (nextStop) {
                setTimeout(() => onSelectStop(nextStop), 220);
              } else if (inglandDepsComplete(stops, solvedChallengeIds)) {
                setTimeout(() => onFinalClick(), 300);
              }
              // else: just close — other branch still pending
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
