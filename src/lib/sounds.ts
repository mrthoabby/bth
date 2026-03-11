// Synthesized game sounds + ambient soundtrack via Web Audio API

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function hz(note: number) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// ── Ambient soundtrack ────────────────────────────────────────────────────────
// Upbeat adventure/romance: C - G - Am - F  ♩ = 148 bpm
// Drive: staccato chords + active running melody + punchy bass + hi-hat pulse

const BEAT = 0.405;         // ~148 bpm — energetic
const BAR  = BEAT * 4;

const PROGRESSION = [
  [60, 64, 67], // C  (C3 E3 G3)
  [55, 59, 62], // G  (G3 B3 D4) — one octave to keep it full
  [57, 60, 64], // Am (A3 C4 E4)
  [53, 57, 60], // F  (F3 A3 C4)
];

// Running 8th-note melody — two notes per beat, 8 per bar
const MELODY8 = [
  76, 79, 81, 79, 76, 72, 74, 76,   // bar 1 feel
  79, 81, 84, 81, 79, 76, 74, 72,   // bar 2 feel
  72, 74, 76, 79, 76, 72, 69, 71,   // bar 3 feel
  72, 74, 76, 72, 71, 69, 71, 72,   // bar 4 feel
];

let musicMaster: GainNode | null = null;
let musicScheduler: ReturnType<typeof setInterval> | null = null;
let musicBar = 0;
let musicNextTime = 0;
let musicAc: AudioContext | null = null;

function schedNote(ac: AudioContext, master: GainNode, note: number, t: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  osc.type = type;
  osc.frequency.value = hz(note);
  osc.connect(g); g.connect(master);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur + 0.05);
}

function schedNoise(ac: AudioContext, master: GainNode, t: number, dur: number, vol: number, freq: number) {
  const buf  = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src    = ac.createBufferSource();
  src.buffer   = buf;
  const filter = ac.createBiquadFilter();
  filter.type  = 'highpass';
  filter.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter); filter.connect(g); g.connect(master);
  src.start(t);
}

function scheduleMusicBar(ac: AudioContext, master: GainNode, t: number, bar: number) {
  const chord = PROGRESSION[bar % PROGRESSION.length];

  // ── Staccato pad chord — hits on beat 1 and beat 3 ──
  [0, 2].forEach((beatOffset) => {
    chord.forEach((note) => {
      schedNote(ac, master, note, t + beatOffset * BEAT, BEAT * 0.75, 0.055, 'triangle');
    });
  });

  // ── Running 8th-note melody (2 notes per beat × 4 beats) ──
  const base = (bar % 4) * 8;
  for (let i = 0; i < 8; i++) {
    const melNote = MELODY8[(base + i) % MELODY8.length];
    const tNote   = t + i * (BEAT / 2);
    // Alternate louder on beat 1 and 3 (downbeats)
    const vol = i % 4 === 0 ? 0.14 : (i % 2 === 0 ? 0.10 : 0.07);
    schedNote(ac, master, melNote, tNote, BEAT * 0.48, vol, 'sine');
  }

  // ── Punchy bass on beat 1 and beat 3 ──
  [0, 2].forEach((b) => {
    schedNote(ac, master, chord[0] - 12, t + b * BEAT, BEAT * 0.55, 0.12, 'sine');
  });

  // ── Hi-hat on every 8th note ──
  for (let i = 0; i < 8; i++) {
    const accent = i % 4 === 0; // louder on downbeats
    schedNoise(ac, master, t + i * (BEAT / 2), BEAT * 0.18, accent ? 0.04 : 0.022, 7000);
  }

  // ── Kick-like thud on beat 1 ──
  {
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz(45), t);
    osc.frequency.exponentialRampToValueAtTime(hz(30), t + 0.12);
    osc.connect(g); g.connect(master);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.start(t); osc.stop(t + 0.16);
  }

  // ── Snare-ish on beat 3 ──
  schedNoise(ac, master, t + BEAT * 2, 0.10, 0.07, 2000);
}

export function startAmbientMusic() {
  if (typeof window === 'undefined') return;
  if (musicScheduler) return; // already playing
  try {
    const ac = new AudioContext();
    if (ac.state === 'suspended') ac.resume();
    musicAc = ac;

    const master = ac.createGain();
    master.gain.value = 0.75;
    master.connect(ac.destination);
    musicMaster = master;

    musicNextTime = ac.currentTime + 0.15;
    musicBar = 0;

    const advance = () => {
      if (!musicAc || !musicMaster) return;
      while (musicNextTime < musicAc.currentTime + 2.2) {
        scheduleMusicBar(musicAc, musicMaster, musicNextTime, musicBar);
        musicNextTime += BAR;
        musicBar++;
      }
    };

    advance();
    musicScheduler = setInterval(advance, 900);
  } catch { /* ignore */ }
}

// ── Duck / un-duck for video playback ─────────────────────────────────────────
export function duckAmbientMusic(fadeMs = 400) {
  if (!musicMaster || !musicAc) return;
  const g = musicMaster;
  const ac = musicAc;
  g.gain.cancelScheduledValues(ac.currentTime);
  g.gain.setValueAtTime(g.gain.value, ac.currentTime);
  g.gain.linearRampToValueAtTime(0.07, ac.currentTime + fadeMs / 1000);
}

export function unduckAmbientMusic(fadeMs = 700) {
  if (!musicMaster || !musicAc) return;
  const g = musicMaster;
  const ac = musicAc;
  g.gain.cancelScheduledValues(ac.currentTime);
  g.gain.setValueAtTime(g.gain.value, ac.currentTime);
  g.gain.linearRampToValueAtTime(0.75, ac.currentTime + fadeMs / 1000);
}

export function stopAmbientMusic(fadeMs = 1200) {
  if (!musicMaster || !musicAc) return;
  if (musicScheduler) { clearInterval(musicScheduler); musicScheduler = null; }
  const g  = musicMaster;
  const ac = musicAc;
  g.gain.setValueAtTime(g.gain.value, ac.currentTime);
  g.gain.linearRampToValueAtTime(0, ac.currentTime + fadeMs / 1000);
  setTimeout(() => {
    try { ac.close(); } catch {}
    musicAc = null;
    musicMaster = null;
    musicBar = 0;
    musicNextTime = 0;
  }, fadeMs + 150);
}

// ── Correct answer / riddle solved ──────────────────────────────────────────
export function playCorrect() {
  try {
    const ac = getCtx();
    // Ascending arpeggio: C5 E5 G5 C6
    const notes = [72, 76, 79, 84];
    notes.forEach((note, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = hz(note);
      const t = ac.currentTime + i * 0.11;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch { /* ignore if audio not available */ }
}

// ── Wrong answer ─────────────────────────────────────────────────────────────
export function playWrong() {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(hz(60), ac.currentTime);
    osc.frequency.linearRampToValueAtTime(hz(54), ac.currentTime + 0.18);
    gain.gain.setValueAtTime(0.18, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.25);
  } catch { /* ignore */ }
}

// ── Island / challenge unlock ─────────────────────────────────────────────────
export function playUnlock() {
  try {
    const ac = getCtx();
    // Sparkle shimmer: rapid high notes
    const notes = [84, 88, 91, 96, 91, 96];
    notes.forEach((note, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.value = hz(note);
      const t = ac.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  } catch { /* ignore */ }
}

// ── Badge earned ──────────────────────────────────────────────────────────────
export function playBadge() {
  try {
    const ac = getCtx();
    const notes = [79, 84, 88];
    notes.forEach((note, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = 'triangle';
      osc.frequency.value = hz(note);
      const t = ac.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch { /* ignore */ }
}

// ── Camera shutter ────────────────────────────────────────────────────────────
export function playShutter() {
  try {
    const ac = getCtx();
    // Short click + white noise burst
    const buf = ac.createBuffer(1, ac.sampleRate * 0.06, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / (data.length * 0.6));
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.value = 0.4;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start(ac.currentTime);
  } catch { /* ignore */ }
}

// ── Paris island whoosh ───────────────────────────────────────────────────────
export function playWhoosh() {
  try {
    const ac = getCtx();
    const buf = ac.createBuffer(1, ac.sampleRate * 0.45, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.6;
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, ac.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2400, ac.currentTime + 0.45);
    filter.Q.value = 1.5;
    src.connect(filter);
    filter.connect(ac.destination);
    src.start(ac.currentTime);

    // Accompany with a rising magical tone
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.connect(g);
    g.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz(60), ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(hz(84), ac.currentTime + 0.4);
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(0.18, ac.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.48);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.5);
  } catch { /* ignore */ }
}

// ── Parchment open — semi-lullaby, tender & magical ──────────────────────────
export function playParchmentOpen() {
  try {
    const ac = getCtx();
    // Soft music-box arpeggio: C5 E5 G5 B5 C6 — like a tender lullaby
    const notes = [72, 76, 79, 83, 84];
    notes.forEach((note, i) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = hz(note);
      // Layer a triangle slightly detuned for warmth
      const osc2  = ac.createOscillator();
      const gain2 = ac.createGain();
      osc2.type = 'triangle';
      osc2.frequency.value = hz(note) * 1.003;
      osc2.connect(gain2); gain2.connect(ac.destination);
      osc.connect(gain); gain.connect(ac.destination);
      const t = ac.currentTime + i * 0.16;
      const vol = i === 4 ? 0.18 : 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(vol * 0.4, t + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.start(t); osc.stop(t + 0.75);
      osc2.start(t); osc2.stop(t + 0.95);
    });
    // Soft sustained chord underneath (C maj)
    [60, 64, 67].forEach((note) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = hz(note);
      osc.connect(gain); gain.connect(ac.destination);
      const t = ac.currentTime + 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      osc.start(t); osc.stop(t + 2.0);
    });
  } catch { /* ignore */ }
}

// ── Island hover — bouncy boing ───────────────────────────────────────────────
export function playIslandHover() {
  try {
    const ac = getCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    // Frequency sweeps up fast then bounces down — classic "boing"
    osc.frequency.setValueAtTime(hz(62), ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(hz(86), ac.currentTime + 0.06);
    osc.frequency.exponentialRampToValueAtTime(hz(78), ac.currentTime + 0.14);
    osc.frequency.exponentialRampToValueAtTime(hz(82), ac.currentTime + 0.20);
    osc.frequency.exponentialRampToValueAtTime(hz(79), ac.currentTime + 0.28);
    osc.connect(gain); gain.connect(ac.destination);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.16, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.32);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.35);
  } catch { /* ignore */ }
}
