'use strict';
/* ═══════════════════════════════════════════════════════════════
 * ALMOST!  —  Card Matching & Slapping Game
 * Rulebook-compliant MVP  ·  2-8 local players  ·  Zero deps
 * ═══════════════════════════════════════════════════════════════ */

// ── 1. Constants & Configuration ─────────────────────────────

const CFG = {
  MUST_SLAP_MS:     2500,
  MUST_NOT_SLAP_MS: 2500,
  NEUTRAL_MS:       1200,
  MIN_PLAYERS:      2,
  MAX_PLAYERS:      8,
  CARD_W:           90,
  CARD_H:           126,
};

const SlapCond = Object.freeze({
  MUST_SLAP:     'MUST_SLAP',
  MUST_NOT_SLAP: 'MUST_NOT_SLAP',
  NEUTRAL:       'NEUTRAL',
});

const Phase = Object.freeze({
  RESUME_PROMPT: 'RESUME_PROMPT',
  MENU:          'MENU',
  SETUP:         'SETUP',
  HOW_TO_PLAY:   'HOW_TO_PLAY',
  PLAYING:       'PLAYING',
  SLAP_WINDOW:   'SLAP_WINDOW',
  GAME_OVER:     'GAME_OVER',
});

const SAVE_KEY = 'almost_game_state_v1';

const PLAYER_KEYS  = ['1','2','3','4','5','6','7','8'];
const PLAYER_COLORS = [
  '#3B82F6','#EF4444','#10B981','#F59E0B',
  '#8B5CF6','#EC4899','#14B8A6','#F97316',
];

// ── 2. Seeded RNG (Mulberry32) ───────────────────────────────

function mulberry32(seed) {
  let s = seed | 0;
  const rng = function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.getState = () => s;
  return rng;
}

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 3. Card Families & Deck ──────────────────────────────────

const FAMILIES = [
  { name: 'Sun',       shape: 'circle',   color: '#F59E0B', bg: '#FFFBEB' },
  { name: 'Mountain',  shape: 'triangle', color: '#059669', bg: '#ECFDF5' },
  { name: 'Ocean',     shape: 'wave',     color: '#2563EB', bg: '#EFF6FF' },
  { name: 'Fire',      shape: 'flame',    color: '#DC2626', bg: '#FEF2F2' },
  { name: 'Crystal',   shape: 'diamond',  color: '#7C3AED', bg: '#F5F3FF' },
  { name: 'Star',      shape: 'star',     color: '#6B7280', bg: '#F9FAFB' },
  { name: 'Tree',      shape: 'tree',     color: '#78350F', bg: '#FFFBEB' },
  { name: 'Moon',      shape: 'crescent', color: '#1E3A5F', bg: '#EFF6FF' },
  { name: 'Bolt',      shape: 'bolt',     color: '#CA8A04', bg: '#FEFCE8' },
  { name: 'Heart',     shape: 'heart',    color: '#DB2777', bg: '#FDF2F8' },
  { name: 'Shield',    shape: 'hexagon',  color: '#4B5563', bg: '#F9FAFB' },
  { name: 'Spiral',    shape: 'spiral',   color: '#0D9488', bg: '#F0FDFA' },
];

const JOKER_DEFS = [
  { id: 'J1', name: 'Slap Now',    color: '#D97706', desc: 'Everyone MUST slap!' },
  { id: 'J2', name: 'Do NOT Slap', color: '#7C3AED', desc: 'Do NOT slap!' },
  { id: 'J3', name: 'Memory Mode', color: '#DC2626', desc: 'Match last 2 cards' },
];

/**
 * Generate the 105-card deck.
 *   12 families × (4 identical + 4 lookalikes) = 96 picture cards
 *   3 × J1 + 3 × J2 + 3 × J3 = 9 jokers
 * Identical cards share the same identicalId → they MATCH.
 * Lookalike cards each have a unique identicalId → they NEVER match.
 */
function generateDeck() {
  const cards = [];
  let uid = 0;
  for (let fi = 0; fi < FAMILIES.length; fi++) {
    const key = FAMILIES[fi].name.toLowerCase();
    for (let c = 0; c < 4; c++) {
      cards.push({ kind: 'PICTURE', uid: uid++, family: key, familyIndex: fi,
                    variant: 'IDENTICAL', identicalId: key + '_I', vi: 0 });
    }
    for (let v = 1; v <= 4; v++) {
      cards.push({ kind: 'PICTURE', uid: uid++, family: key, familyIndex: fi,
                    variant: 'LOOKALIKE', identicalId: key + '_L' + v, vi: v });
    }
  }
  for (const jd of JOKER_DEFS) {
    for (let c = 0; c < 3; c++) {
      cards.push({ kind: 'JOKER', uid: uid++, id: jd.id,
                    label: jd.name, jcolor: jd.color, jdesc: jd.desc });
    }
  }
  return cards; // 105
}

// ── 4. SVG Card Rendering ────────────────────────────────────

function cardBackSvg() {
  const W = CFG.CARD_W, H = CFG.CARD_H;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="6" fill="#1E293B" stroke="#334155"/>
    <rect x="5" y="5" width="${W-10}" height="${H-10}" rx="4" fill="none" stroke="#475569" stroke-dasharray="4 3"/>
    <text x="${W/2}" y="${H/2-4}" text-anchor="middle" font-size="18" font-weight="bold" fill="#94A3B8" font-family="sans-serif">A!</text>
    <text x="${W/2}" y="${H/2+12}" text-anchor="middle" font-size="7" fill="#64748B" font-family="sans-serif">ALMOST</text>
  </svg>`;
}

function drawShape(shape, cx, cy, size, color, bgColor, variant) {
  const filled = variant !== 1;
  const fill = filled ? color : 'none';
  const sw = filled ? '0.5' : '2';
  const sc = variant === 4 ? 0.72 : 1;
  const r = size * sc;
  let svg = '';

  switch (shape) {
    case 'circle':
      svg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`;
      break;
    case 'triangle': {
      const pts = [[0,-r],[r*0.87,r*0.5],[-r*0.87,r*0.5]]
        .map(([dx,dy]) => `${cx+dx},${cy+dy}`).join(' ');
      svg = `<polygon points="${pts}" fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`;
      break;
    }
    case 'wave': {
      const lines = [-8, 0, 8].map(yOff => {
        const y = cy + yOff;
        return `<path d="M${cx-r} ${y} Q${cx-r*0.5} ${y-10} ${cx} ${y} Q${cx+r*0.5} ${y+10} ${cx+r} ${y}"
          fill="none" stroke="${color}" stroke-width="${filled ? 2.5 : 1.5}" stroke-linecap="round"/>`;
      });
      svg = lines.join('');
      break;
    }
    case 'flame':
      svg = `<path d="M${cx} ${cy-r} Q${cx+r*0.7} ${cy-r*0.2} ${cx+r*0.4} ${cy+r*0.4}
        Q${cx+r*0.15} ${cy+r} ${cx} ${cy+r*0.7} Q${cx-r*0.15} ${cy+r} ${cx-r*0.4} ${cy+r*0.4}
        Q${cx-r*0.7} ${cy-r*0.2} ${cx} ${cy-r} Z"
        fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`;
      break;
    case 'diamond': {
      const pts = [[0,-r],[r*0.6,0],[0,r],[-r*0.6,0]]
        .map(([dx,dy]) => `${cx+dx},${cy+dy}`).join(' ');
      svg = `<polygon points="${pts}" fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`;
      break;
    }
    case 'star': {
      let pts = [];
      for (let i = 0; i < 5; i++) {
        const aO = (i * 72 - 90) * Math.PI / 180;
        const aI = (i * 72 + 36 - 90) * Math.PI / 180;
        pts.push(`${cx+r*Math.cos(aO)},${cy+r*Math.sin(aO)}`);
        pts.push(`${cx+r*0.38*Math.cos(aI)},${cy+r*0.38*Math.sin(aI)}`);
      }
      svg = `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`;
      break;
    }
    case 'tree':
      svg = `<rect x="${cx-2.5}" y="${cy+r*0.25}" width="5" height="${r*0.65}" fill="${color}" rx="1"/>
        <polygon points="${cx},${cy-r} ${cx+r*0.65},${cy+r*0.3} ${cx-r*0.65},${cy+r*0.3}"
        fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`;
      break;
    case 'crescent':
      if (filled) {
        svg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>
          <circle cx="${cx+r*0.38}" cy="${cy-r*0.12}" r="${r*0.72}" fill="${bgColor}"/>`;
      } else {
        svg = `<path d="M${cx-r*0.1} ${cy-r} A${r} ${r} 0 1 0 ${cx-r*0.1} ${cy+r}
          A${r*0.72} ${r*0.72} 0 1 1 ${cx-r*0.1} ${cy-r}" fill="none" stroke="${color}" stroke-width="2"/>`;
      }
      break;
    case 'bolt':
      svg = `<polygon points="${cx-r*0.15},${cy-r} ${cx+r*0.55},${cy-r} ${cx+r*0.05},${cy-r*0.1}
        ${cx+r*0.45},${cy-r*0.1} ${cx-r*0.2},${cy+r} ${cx+r*0.1},${cy} ${cx-r*0.35},${cy}"
        fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`;
      break;
    case 'heart': {
      const hr = r * 0.5;
      svg = `<path d="M${cx} ${cy+r*0.7} Q${cx-r*1.1} ${cy} ${cx-r*0.5} ${cy-r*0.4}
        A${hr} ${hr} 0 0 1 ${cx} ${cy-r*0.15}
        A${hr} ${hr} 0 0 1 ${cx+r*0.5} ${cy-r*0.4}
        Q${cx+r*1.1} ${cy} ${cx} ${cy+r*0.7} Z"
        fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`;
      break;
    }
    case 'hexagon': {
      let pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60 - 30) * Math.PI / 180;
        pts.push(`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`);
      }
      svg = `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${color}" stroke-width="${sw}"/>`;
      break;
    }
    case 'spiral': {
      const n = 36;
      let d = '';
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const angle = t * 5 * Math.PI - Math.PI / 2;
        const rad = r * 0.12 + r * 0.88 * t;
        const x = cx + rad * Math.cos(angle);
        const y = cy + rad * Math.sin(angle);
        d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      svg = `<path d="${d}" fill="none" stroke="${color}" stroke-width="${filled ? 2.5 : 1.5}" stroke-linecap="round"/>`;
      break;
    }
  }

  let extras = '';
  if (variant === 2) {
    extras = `<line x1="${cx-10}" y1="${cy-10}" x2="${cx+10}" y2="${cy+10}" stroke="${color}" stroke-width="0.7" opacity="0.35"/>
      <line x1="${cx-10}" y1="${cy-4}" x2="${cx+4}" y2="${cy+10}" stroke="${color}" stroke-width="0.7" opacity="0.35"/>
      <line x1="${cx-4}" y1="${cy-10}" x2="${cx+10}" y2="${cy+4}" stroke="${color}" stroke-width="0.7" opacity="0.35"/>`;
  } else if (variant === 3) {
    extras = `<circle cx="${cx+r*0.8}" cy="${cy-r*0.7}" r="2.5" fill="${color}" opacity="0.55"/>`;
  }
  return svg + extras;
}

function renderCardSvg(card) {
  if (card.kind === 'JOKER') return jokerSvg(card);
  const fam = FAMILIES[card.familyIndex];
  const W = CFG.CARD_W, H = CFG.CARD_H;
  const cx = W / 2, cy = 48, r = 20;
  const shapeSvg = drawShape(fam.shape, cx, cy, r, fam.color, fam.bg, card.vi);
  const marker = card.variant === 'LOOKALIKE'
    ? `<circle cx="${W-12}" cy="12" r="3.5" fill="${fam.color}" opacity="0.18"/>`
    : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="6" fill="${fam.bg}" stroke="${fam.color}" stroke-width="1.5"/>
    ${shapeSvg}
    <text x="${W/2}" y="${H-14}" text-anchor="middle" font-size="9" fill="${fam.color}" font-family="sans-serif" font-weight="600">${fam.name}</text>
    ${marker}
  </svg>`;
}

function jokerSvg(card) {
  const jd = JOKER_DEFS.find(j => j.id === card.id);
  const W = CFG.CARD_W, H = CFG.CARD_H;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="6" fill="#1a1a2e" stroke="${jd.color}" stroke-width="2"/>
    <text x="${W/2}" y="36" text-anchor="middle" font-size="26" font-weight="bold" fill="${jd.color}" font-family="sans-serif">${jd.id}</text>
    <text x="${W/2}" y="56" text-anchor="middle" font-size="10" fill="#E2E8F0" font-family="sans-serif">JOKER</text>
    <text x="${W/2}" y="74" text-anchor="middle" font-size="8" fill="${jd.color}" font-family="sans-serif">${jd.name}</text>
    <text x="${W/2}" y="${H-18}" text-anchor="middle" font-size="7" fill="#94A3B8" font-family="sans-serif">${jd.desc}</text>
    <text x="10" y="15" font-size="9" fill="${jd.color}" font-family="sans-serif">&#9733;</text>
    <text x="${W-15}" y="15" font-size="9" fill="${jd.color}" font-family="sans-serif">&#9733;</text>
    <text x="10" y="${H-7}" font-size="9" fill="${jd.color}" font-family="sans-serif">&#9733;</text>
    <text x="${W-15}" y="${H-7}" font-size="9" fill="${jd.color}" font-family="sans-serif">&#9733;</text>
  </svg>`;
}

// ── 5. Game State ────────────────────────────────────────────

let state = null;
let slapTimeoutId = null;
let timerRAF = null;

function freshState() {
  return {
    phase: Phase.MENU,
    players: [],           // { deck:[], slapAnim:0 }
    pile: [],
    currentPlayer: 0,
    turnCount: 0,
    memoryMode: false,     // activated by J3, resets on pile pickup
    slapCondition: SlapCond.NEUTRAL,
    slapStartTime: 0,
    slapWindowMs: 0,
    slaps: [],             // { pi, ts }
    finishOrder: [],        // player indices in order they emptied hand
    winner: null,
    runnerUp: null,
    settings: {
      playerCount: 2,
      seed: Math.floor(Math.random() * 999999),
      soundEnabled: true,
    },
    rng: null,
    debug: false,
    log: [],
    showExitConfirm: false,
    savedSnapshot: null,    // for RESUME_PROMPT
  };
}

function addLog(msg) {
  state.log.push(msg);
  if (state.log.length > 50) state.log.shift();
}

function pname(i) { return 'Player ' + (i + 1); }

// ── 5b. State Persistence (localStorage) ─────────────────────

function saveState() {
  if (!state || !state.rng) return;
  if (state.phase !== Phase.PLAYING && state.phase !== Phase.SLAP_WINDOW && state.phase !== Phase.GAME_OVER) return;
  try {
    const snap = {
      v: 1,
      phase: state.phase,
      players: state.players.map(p => ({ deck: p.deck.slice() })),
      pile: state.pile.slice(),
      currentPlayer: state.currentPlayer,
      turnCount: state.turnCount,
      memoryMode: state.memoryMode,
      finishOrder: state.finishOrder.slice(),
      winner: state.winner,
      runnerUp: state.runnerUp,
      settings: { ...state.settings },
      rngState: state.rng.getState(),
      log: state.log.slice(-10),
      savedAt: Date.now(),
    };
    // SLAP_WINDOW fidelity fields
    if (state.phase === Phase.SLAP_WINDOW) {
      snap.slapCondition = state.slapCondition;
      snap.slapWindowMs = state.slapWindowMs;
      snap.slapWindowOpenedAt = state.slapWindowOpenedAt;
      snap.slaps = state.slaps.map((s, i) => ({ pi: s.pi, order: i }));
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
  } catch (_) { /* storage full / private mode / security */ }
}

function clearSaveState() {
  try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
}

function loadSaveState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw);
    if (!snap || snap.v !== 1 || !snap.players || !snap.pile) return null;
    if (snap.phase === Phase.GAME_OVER) return null; // don't resume finished games
    return snap;
  } catch (_) { return null; }
}

function restoreFromSnapshot(snap) {
  state.players = snap.players.map(p => ({ deck: p.deck, slapAnim: 0 }));
  state.pile = snap.pile;
  state.currentPlayer = snap.currentPlayer;
  state.turnCount = snap.turnCount;
  state.memoryMode = snap.memoryMode;
  state.finishOrder = snap.finishOrder || [];
  state.winner = snap.winner;
  state.runnerUp = snap.runnerUp;
  state.settings = snap.settings;
  state.rng = mulberry32(snap.rngState);
  state.log = snap.log || [];
  state.savedSnapshot = null;

  if (snap.phase === Phase.SLAP_WINDOW && snap.slapWindowOpenedAt) {
    state.slapCondition = snap.slapCondition;
    state.slapWindowMs = snap.slapWindowMs;
    state.slapWindowOpenedAt = snap.slapWindowOpenedAt;
    // Reconstruct slaps preserving recorded order
    state.slaps = (snap.slaps || []).map((s, i) => ({ pi: s.pi, ts: i }));

    const elapsed = Date.now() - snap.slapWindowOpenedAt;
    const remainingMs = snap.slapWindowMs - elapsed;

    if (remainingMs > 0) {
      // Window still active — resume with remaining time
      state.phase = Phase.SLAP_WINDOW;
      state.slapStartTime = performance.now() - elapsed;
      addLog('Game resumed \u2014 slap window active!');
      render();
      startTimerAnimation();
      slapTimeoutId = setTimeout(resolveSlapWindow, remainingMs);
    } else {
      // Window expired while page was closed — resolve immediately
      state.phase = Phase.SLAP_WINDOW;
      addLog('Game resumed \u2014 resolving slap window.');
      resolveSlapWindow();
    }
  } else {
    // PLAYING phase or SLAP_WINDOW without fidelity data (graceful fallback)
    state.phase = (snap.phase === Phase.SLAP_WINDOW) ? Phase.PLAYING : snap.phase;
    state.slapCondition = SlapCond.NEUTRAL;
    addLog('Game resumed.');
    render();
  }
}

// ── 5c. Exit Game Navigation ─────────────────────────────────

function isSafeReturnPath(path) {
  try {
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return false;
    const url = new URL(path, window.location.origin);
    return url.origin === window.location.origin;
  } catch (_) { return false; }
}

function getBasePath() {
  const idx = window.location.pathname.indexOf('/games/almost/');
  if (idx >= 0) return window.location.pathname.substring(0, idx) + '/';
  return '/';
}

function exitGame() {
  clearSaveState();
  clearAllTimers();
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');
  if (returnTo && isSafeReturnPath(returnTo)) {
    window.location.href = returnTo;
    return;
  }
  if (window.opener) {
    try { window.close(); return; } catch (_) {}
  }
  window.location.href = getBasePath();
}

// ── 6. Game Logic ────────────────────────────────────────────

function startGame() {
  const { playerCount, seed } = state.settings;
  state.rng = mulberry32(seed);
  const deck = shuffle(generateDeck(), state.rng);
  state.players = [];
  for (let i = 0; i < playerCount; i++) {
    state.players.push({ deck: [], slapAnim: 0 });
  }
  let idx = 0;
  for (const card of deck) {
    state.players[idx % playerCount].deck.push(card);
    idx++;
  }
  state.pile = [];
  state.currentPlayer = Math.floor(state.rng() * playerCount);
  state.turnCount = 0;
  state.memoryMode = false;
  state.finishOrder = [];
  state.winner = null;
  state.runnerUp = null;
  state.log = [];
  state.phase = Phase.PLAYING;
  addLog('Game started! ' + pname(state.currentPlayer) + ' goes first.');
  saveState();
  render();
}

/** Two picture cards match iff they share the same identicalId. */
function isIdenticalMatch(a, b) {
  return a.kind === 'PICTURE' && b.kind === 'PICTURE' && a.identicalId === b.identicalId;
}

/** Evaluate the slap condition for the card just flipped onto the pile. */
function evaluateSlapCondition() {
  const pile = state.pile;
  const top = pile[pile.length - 1];

  // J1 → everyone MUST slap
  if (top.kind === 'JOKER' && top.id === 'J1') return SlapCond.MUST_SLAP;

  // J2 → nobody should slap
  if (top.kind === 'JOKER' && top.id === 'J2') return SlapCond.MUST_NOT_SLAP;

  // J3 → activate memory mode, card itself is NEUTRAL
  if (top.kind === 'JOKER' && top.id === 'J3') {
    state.memoryMode = true;
    addLog('Memory Mode activated! Match checks last 2 cards.');
    return SlapCond.NEUTRAL;
  }

  // Standard match: top vs previous card
  if (pile.length >= 2) {
    const prev = pile[pile.length - 2];
    if (isIdenticalMatch(top, prev)) return SlapCond.MUST_SLAP;
  }

  // Memory mode: also check card 2 back
  if (state.memoryMode && pile.length >= 3) {
    const prev2 = pile[pile.length - 3];
    if (isIdenticalMatch(top, prev2)) return SlapCond.MUST_SLAP;
  }

  return SlapCond.NEUTRAL;
}

function flipCard() {
  if (state.phase !== Phase.PLAYING) return;
  const player = state.players[state.currentPlayer];
  if (player.deck.length === 0) return;

  const card = player.deck.shift();
  state.pile.push(card);
  state.turnCount++;
  sfx.flip();

  // Check if player just emptied their hand
  if (player.deck.length === 0 && !state.finishOrder.includes(state.currentPlayer)) {
    state.finishOrder.push(state.currentPlayer);
    addLog(pname(state.currentPlayer) + ' is out of cards! Temporarily safe.');
    if (checkGameOver()) return;
  }

  // Evaluate slap condition and open window
  const cond = evaluateSlapCondition();
  state.slapCondition = cond;
  openSlapWindow(cond);
}

function openSlapWindow(cond) {
  const ms = cond === SlapCond.MUST_SLAP     ? CFG.MUST_SLAP_MS
           : cond === SlapCond.MUST_NOT_SLAP ? CFG.MUST_NOT_SLAP_MS
           : CFG.NEUTRAL_MS;
  state.slapWindowMs = ms;
  state.phase = Phase.SLAP_WINDOW;
  state.slaps = [];
  state.slapStartTime = performance.now();
  state.slapWindowOpenedAt = Date.now();
  saveState();
  render();
  startTimerAnimation();
  slapTimeoutId = setTimeout(resolveSlapWindow, ms);
}

function handleSlap(playerIndex) {
  if (playerIndex < 0 || playerIndex >= state.players.length) return;

  // Slap during PLAYING → invalid immediate slap, pick up pile
  if (state.phase === Phase.PLAYING) {
    if (state.pile.length === 0) return;
    addLog(pname(playerIndex) + ' slapped too early! Picks up the pile.');
    sfx.penalty();
    state.players[playerIndex].slapAnim = Date.now();
    haptic([50]);
    pickupPile(playerIndex);
    return;
  }

  if (state.phase !== Phase.SLAP_WINDOW) return;
  if (state.slaps.some(s => s.pi === playerIndex)) return; // already slapped

  state.slaps.push({ pi: playerIndex, ts: performance.now() });
  state.players[playerIndex].slapAnim = Date.now();
  sfx.slap();
  haptic([50]);
  saveState();
  render();
}

function resolveSlapWindow() {
  if (state.phase !== Phase.SLAP_WINDOW) return; // guard against double resolution
  clearTimeout(slapTimeoutId);
  slapTimeoutId = null;
  cancelTimerAnimation();

  const cond = state.slapCondition;
  const allPIs = state.players.map((_, i) => i);
  state.slaps.sort((a, b) => a.ts - b.ts);

  if (cond === SlapCond.MUST_SLAP) {
    // Everyone should slap. Loser = non-slapper with highest index, or last to slap.
    const slapperSet = new Set(state.slaps.map(s => s.pi));
    const nonSlappers = allPIs.filter(i => !slapperSet.has(i));
    let loser;
    if (nonSlappers.length > 0) {
      loser = Math.max(...nonSlappers);
      addLog(pname(loser) + " didn't slap! Picks up the pile.");
    } else if (state.slaps.length > 0) {
      loser = state.slaps[state.slaps.length - 1].pi;
      addLog(pname(loser) + ' was last to slap! Picks up the pile.');
    } else {
      loser = Math.max(...allPIs);
      addLog('Nobody slapped! ' + pname(loser) + ' picks up the pile.');
    }
    sfx.penalty();
    pickupPile(loser);

  } else if (cond === SlapCond.MUST_NOT_SLAP) {
    // Nobody should slap. First to slap picks up.
    if (state.slaps.length > 0) {
      const loser = state.slaps[0].pi;
      addLog(pname(loser) + ' slapped on Do NOT Slap! Picks up the pile.');
      sfx.penalty();
      pickupPile(loser);
    } else {
      addLog('Nobody slapped. Well done!');
      advanceToNext();
    }

  } else {
    // NEUTRAL: any slapper picks up (invalid slap)
    if (state.slaps.length > 0) {
      const loser = state.slaps[0].pi;
      addLog(pname(loser) + ' false slap! Picks up the pile.');
      sfx.penalty();
      pickupPile(loser);
    } else {
      advanceToNext();
    }
  }
}

function pickupPile(playerIndex) {
  if (state.pile.length === 0) {
    advanceToNext();
    return;
  }
  const player = state.players[playerIndex];
  const pileCards = state.pile.splice(0);
  player.deck.push(...shuffle(pileCards, state.rng));

  // If player was safe, they re-enter
  const safeIdx = state.finishOrder.indexOf(playerIndex);
  if (safeIdx >= 0) {
    state.finishOrder.splice(safeIdx, 1);
    addLog(pname(playerIndex) + ' re-enters the game!');
  }

  // Memory mode resets on pile pickup
  state.memoryMode = false;

  addLog(pname(playerIndex) + ' picks up ' + pileCards.length + ' card' + (pileCards.length !== 1 ? 's' : '') + '.');

  if (checkGameOver()) return;

  // Picker starts next round
  state.currentPlayer = playerIndex;
  state.phase = Phase.PLAYING;
  saveState();
  render();
}

function advanceToNext() {
  for (let i = 1; i <= state.players.length; i++) {
    const idx = (state.currentPlayer + i) % state.players.length;
    if (state.players[idx].deck.length > 0) {
      state.currentPlayer = idx;
      state.phase = Phase.PLAYING;
      saveState();
      render();
      return;
    }
  }
  // All players are safe — shouldn't normally happen but handle gracefully
  checkGameOver();
  render();
}

function checkGameOver() {
  if (state.finishOrder.length >= 2) {
    state.winner = state.finishOrder[0];
    state.runnerUp = state.finishOrder[1];
    state.phase = Phase.GAME_OVER;
    clearSaveState();
    sfx.win();
    render();
    return true;
  }
  return false;
}

// ── 7. Timer Animation ──────────────────────────────────────

function startTimerAnimation() {
  cancelTimerAnimation();
  function tick() {
    const bar = document.querySelector('.slap-timer-fill');
    if (!bar || state.phase !== Phase.SLAP_WINDOW) return;
    const elapsed = performance.now() - state.slapStartTime;
    const pct = Math.max(0, 1 - elapsed / state.slapWindowMs) * 100;
    bar.style.width = pct + '%';
    if (pct > 0) timerRAF = requestAnimationFrame(tick);
  }
  timerRAF = requestAnimationFrame(tick);
}

function cancelTimerAnimation() {
  if (timerRAF) { cancelAnimationFrame(timerRAF); timerRAF = null; }
}

// ── 8. Audio ─────────────────────────────────────────────────

let audioCtx = null;
function beep(freq, dur, vol) {
  if (!state || !state.settings.soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = freq; gain.gain.value = vol || 0.15;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.stop(audioCtx.currentTime + dur / 1000);
  } catch (_) { /* ignore audio errors */ }
}
const sfx = {
  flip:    () => beep(520, 80),
  slap:    () => beep(880, 100, 0.2),
  penalty: () => beep(220, 250, 0.2),
  win:     () => { beep(523, 100); setTimeout(() => beep(659, 100), 120); setTimeout(() => beep(784, 200), 240); },
};

function haptic(pattern) {
  try { if (navigator.vibrate && state.settings.soundEnabled) navigator.vibrate(pattern); } catch (_) {}
}

// ── 9. UI Rendering ──────────────────────────────────────────

function render() {
  const app = document.getElementById('app');
  if (!app) return;
  let html = '';
  switch (state.phase) {
    case Phase.RESUME_PROMPT: html = renderResumePrompt(); break;
    case Phase.MENU:          html = renderMenu(); break;
    case Phase.SETUP:         html = renderSetup(); break;
    case Phase.HOW_TO_PLAY:   html = renderHowToPlay(); break;
    case Phase.PLAYING:       html = renderGame(); break;
    case Phase.SLAP_WINDOW:   html = renderGame(); break;
    case Phase.GAME_OVER:     html = renderGameOver(); break;
  }
  if (state.showExitConfirm) html += renderExitConfirmOverlay();
  app.innerHTML = html;
}

function renderMenu() {
  return `<div class="screen menu-screen">
    <div class="menu-content">
      <h1 class="title">ALMOST!</h1>
      <p class="subtitle">The Card Matching &amp; Slapping Game</p>
      <div class="card-preview">${renderCardSvg(generateDeck()[0])}</div>
      <div class="menu-btns">
        <button class="btn btn-primary" data-action="new-game">New Game</button>
        <button class="btn btn-secondary" data-action="how-to-play">How to Play</button>
      </div>
    </div>
    <div class="menu-footer">
      <button class="btn-icon" data-action="toggle-sound" title="Toggle sound">${state.settings.soundEnabled ? '\u{1F50A}' : '\u{1F507}'}</button>
    </div>
  </div>`;
}

function renderSetup() {
  return `<div class="screen setup-screen">
    <h2>Game Setup</h2>
    <div class="setup-form">
      <div class="setup-row">
        <label>Players</label>
        <div class="player-count-row">
          ${[2,3,4,5,6,7,8].map(n =>
            `<button class="count-btn${state.settings.playerCount === n ? ' active' : ''}" data-action="set-players" data-val="${n}">${n}</button>`
          ).join('')}
        </div>
      </div>
      <div class="setup-row">
        <label>Seed <span class="label-hint">(same seed = same deal)</span></label>
        <input type="number" class="seed-input" id="seed-input" value="${state.settings.seed}">
      </div>
      <div class="setup-row player-preview">
        ${Array.from({length: state.settings.playerCount}, (_, i) =>
          `<span class="player-dot" style="background:${PLAYER_COLORS[i]}">${i+1}</span>`
        ).join('')}
      </div>
    </div>
    <div class="setup-btns">
      <button class="btn btn-primary" data-action="start-game">Start Game</button>
      <button class="btn btn-ghost" data-action="back-to-menu">Back</button>
    </div>
  </div>`;
}

function renderHowToPlay() {
  return `<div class="screen htp-screen">
    <h2>How to Play</h2>
    <div class="rules-content">
      <section>
        <h3>\u{1F3AF} Goal</h3>
        <p>Be the <strong>first player to get rid of all your cards</strong>. Picking up the pile is BAD!</p>
      </section>
      <section>
        <h3>\u{1F0CF} The Deck</h3>
        <p><strong>105 cards</strong>: 12 families \u00D7 8 cards each + 9 Jokers.</p>
        <ul>
          <li><strong>4 identical cards</strong> per family &mdash; these MATCH</li>
          <li><strong>4 lookalikes</strong> per family &mdash; similar but do NOT match</li>
        </ul>
      </section>
      <section>
        <h3>\u{1F504} Gameplay</h3>
        <ol>
          <li>Cards are dealt evenly face-down</li>
          <li>On your turn, flip your top card onto the pile</li>
          <li>Watch for matches and slap conditions!</li>
        </ol>
      </section>
      <section>
        <h3>\u{1F44B} Slapping Rules</h3>
        <ul>
          <li><strong>Identical match</strong> \u2192 Everyone MUST slap! <em>Last</em> to slap picks up the pile</li>
          <li><strong>No match</strong> \u2192 Do NOT slap! First to slap picks up the pile</li>
          <li>Slapping at the wrong time = you pick up the entire pile</li>
          <li>If no one slaps on a must-slap, highest-numbered non-slapper picks up</li>
        </ul>
      </section>
      <section>
        <h3>\u{1F0CF} Jokers</h3>
        <ul>
          <li><strong>J1 &ldquo;Slap Now&rdquo;</strong> &mdash; Everyone MUST slap! Last to slap picks up</li>
          <li><strong>J2 &ldquo;Do NOT Slap&rdquo;</strong> &mdash; Nobody should slap. First to slap picks up</li>
          <li><strong>J3 &ldquo;Memory Mode&rdquo;</strong> &mdash; Until next pile pickup, matches check the last <strong>2</strong> cards</li>
        </ul>
      </section>
      <section>
        <h3>\u{1F4E6} Picking Up the Pile</h3>
        <ul>
          <li>Take the entire pile and add it to the bottom of your deck</li>
          <li>You start the next round</li>
          <li>Memory Mode resets</li>
        </ul>
      </section>
      <section>
        <h3>\u{1F3C6} Winning</h3>
        <ul>
          <li><strong>Winner</strong> = first player to empty their hand</li>
          <li><strong>Runner-up</strong> = second player to empty (the &ldquo;Almost&rdquo; winner!)</li>
          <li>Safe players still participate in slaps &mdash; if you pick up, you're back in!</li>
        </ul>
      </section>
      <section>
        <h3>\u{2328}\u{FE0F} Controls</h3>
        <p><kbd>Space</kbd> / <kbd>Enter</kbd> &mdash; Flip card (your turn)</p>
        <p><kbd>1</kbd>&ndash;<kbd>8</kbd> &mdash; Slap (player number)</p>
        <p>Tap player zone or pile &mdash; Slap</p>
        <p><kbd>D</kbd> &mdash; Toggle debug &nbsp;&bull;&nbsp; <kbd>Escape</kbd> &mdash; Back</p>
      </section>
    </div>
    <button class="btn btn-ghost" data-action="back-to-menu">Back</button>
  </div>`;
}

function renderGame() {
  const isSlap = state.phase === Phase.SLAP_WINDOW;
  const cond = state.slapCondition;
  const topCard = state.pile.length > 0 ? state.pile[state.pile.length - 1] : null;
  const half = Math.ceil(state.players.length / 2);
  const lastLog = state.log.length > 0 ? state.log[state.log.length - 1] : '';

  const slapClass = isSlap
    ? (cond === SlapCond.MUST_SLAP ? ' slap-must' : cond === SlapCond.MUST_NOT_SLAP ? ' slap-must-not' : ' slap-neutral')
    : '';

  const bannerText = isSlap
    ? (cond === SlapCond.MUST_SLAP ? 'SLAP!' : cond === SlapCond.MUST_NOT_SLAP ? "DON'T SLAP!" : '')
    : '';

  const canFlip = state.phase === Phase.PLAYING
    && state.players[state.currentPlayer].deck.length > 0;

  return `<div class="screen game-screen${slapClass}">
    <div class="game-header">
      <span class="turn-badge">Turn ${state.turnCount}</span>
      ${state.memoryMode ? '<span class="mem-badge">MEM</span>' : ''}
      <span class="current-turn" style="color:${PLAYER_COLORS[state.currentPlayer]}">${pname(state.currentPlayer)}'s turn</span>
      <div class="hdr-btns">
        <button class="btn-icon" data-action="toggle-sound">${state.settings.soundEnabled ? '\u{1F50A}' : '\u{1F507}'}</button>
        <button class="btn-icon" data-action="toggle-debug">\u2699</button>
        <button class="btn-exit" data-action="exit-game" title="Exit Game">\u2715 Exit</button>
      </div>
    </div>
    <div class="players-row">
      ${state.players.slice(0, half).map((p, i) => playerZone(p, i)).join('')}
    </div>
    <div class="pile-area" data-action="slap" data-player="0">
      ${bannerText ? `<div class="slap-banner">${bannerText}</div>` : ''}
      ${isSlap ? '<div class="slap-timer"><div class="slap-timer-fill"></div></div>' : ''}
      <div class="pile-cards">
        <div class="pile-card">${topCard ? renderCardSvg(topCard) : '<div class="empty-pile">Empty</div>'}</div>
        ${state.pile.length > 1 ? '<div class="pile-shadow"></div>' : ''}
      </div>
      <div class="pile-count">${state.pile.length} card${state.pile.length !== 1 ? 's' : ''} in pile</div>
      ${canFlip
        ? '<button class="btn btn-flip" data-action="flip">FLIP <span class="flip-hint">(Space)</span></button>'
        : ''}
    </div>
    <div class="players-row">
      ${state.players.slice(half).map((p, i) => playerZone(p, i + half)).join('')}
    </div>
    <div class="game-log">${lastLog}</div>
    ${state.debug ? renderDebug() : ''}
  </div>`;
}

function playerZone(player, idx) {
  const cur = idx === state.currentPlayer;
  const safe = state.finishOrder.includes(idx);
  const recentSlap = player.slapAnim && (Date.now() - player.slapAnim < 600);
  return `<div class="player-zone${cur ? ' current' : ''}${safe ? ' safe' : ''}${recentSlap ? ' slap-flash' : ''}"
    style="--pc:${PLAYER_COLORS[idx]}" data-action="slap" data-player="${idx}">
    <div class="pz-name" style="color:${PLAYER_COLORS[idx]}">P${idx+1}</div>
    <div class="pz-cards">${player.deck.length}</div>
    ${safe
      ? '<div class="pz-safe">SAFE</div>'
      : `<div class="pz-key">${PLAYER_KEYS[idx]}</div>`}
  </div>`;
}

function renderGameOver() {
  const w = state.winner;
  const r = state.runnerUp;
  const remaining = state.players
    .map((p, i) => ({ i, cards: p.deck.length }))
    .filter(s => s.i !== w && s.i !== r)
    .sort((a, b) => a.cards - b.cards);

  return `<div class="screen gameover-screen">
    <h1 class="go-title">Game Over!</h1>
    <div class="go-results">
      <div class="go-row go-winner" style="--pc:${PLAYER_COLORS[w]}">
        <span class="go-rank">\u{1F3C6}</span>
        <span class="go-name">${pname(w)}</span>
        <span class="go-label">Winner!</span>
      </div>
      <div class="go-row go-runnerup" style="--pc:${PLAYER_COLORS[r]}">
        <span class="go-rank">\u{1F948}</span>
        <span class="go-name">${pname(r)}</span>
        <span class="go-label">Almost!</span>
      </div>
      ${remaining.map(s =>
        `<div class="go-row" style="--pc:${PLAYER_COLORS[s.i]}">
          <span class="go-rank">&nbsp;</span>
          <span class="go-name">${pname(s.i)}</span>
          <span class="go-label">${s.cards} cards left</span>
        </div>`
      ).join('')}
    </div>
    <div class="go-stats">
      <span>Turns: ${state.turnCount}</span>
      <span>Seed: ${state.settings.seed}</span>
    </div>
    <div class="go-btns">
      <button class="btn btn-primary" data-action="play-again">Play Again</button>
      <button class="btn btn-ghost" data-action="back-to-menu">New Game</button>
      <button class="btn btn-ghost" data-action="exit-game">Exit to Hub</button>
    </div>
  </div>`;
}

function renderResumePrompt() {
  return `<div class="screen resume-screen">
    <div class="menu-content">
      <h1 class="title">ALMOST!</h1>
      <p class="subtitle">A game in progress was found.</p>
      <p class="resume-detail">Resume where you left off?</p>
      <div class="menu-btns">
        <button class="btn btn-primary" data-action="resume-yes">Resume Game</button>
        <button class="btn btn-ghost" data-action="resume-no">Start New Game</button>
      </div>
    </div>
  </div>`;
}

function renderExitConfirmOverlay() {
  return `<div class="overlay">
    <div class="overlay-box">
      <h3>Exit Game?</h3>
      <p>Exit and return to hub?</p>
      <div class="overlay-btns">
        <button class="btn btn-primary" data-action="exit-confirm-yes">Yes, Exit</button>
        <button class="btn btn-ghost" data-action="exit-confirm-no">Cancel</button>
      </div>
    </div>
  </div>`;
}

function renderDebug() {
  return `<div class="debug-panel">
    <h4>Debug</h4>
    <pre>${JSON.stringify({
      phase: state.phase, turn: state.turnCount,
      current: state.currentPlayer, mem: state.memoryMode,
      pile: state.pile.length, cond: state.slapCondition,
      finish: state.finishOrder,
      players: state.players.map(p => p.deck.length),
      seed: state.settings.seed,
    }, null, 1)}</pre>
    <div class="debug-log">${state.log.slice(-8).map(l => '<div>' + l + '</div>').join('')}</div>
  </div>`;
}

// ── 10. Event Handling ───────────────────────────────────────

function initEvents() {
  const app = document.getElementById('app');

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case 'new-game':
        state.phase = Phase.SETUP; render(); break;
      case 'how-to-play':
        state.phase = Phase.HOW_TO_PLAY; render(); break;
      case 'back-to-menu':
        clearAllTimers();
        clearSaveState();
        Object.assign(state, { phase: Phase.MENU, finishOrder: [], winner: null, runnerUp: null });
        render(); break;
      case 'set-players':
        state.settings.playerCount = parseInt(el.dataset.val); render(); break;
      case 'start-game':
        readSetupInputs(); startGame(); break;
      case 'flip':
        flipCard(); break;
      case 'slap':
        handleSlap(parseInt(el.dataset.player)); break;
      case 'toggle-sound':
        state.settings.soundEnabled = !state.settings.soundEnabled; render(); break;
      case 'toggle-debug':
        state.debug = !state.debug; render(); break;
      case 'play-again':
        startGame(); break;
      case 'exit-game':
        if (state.phase === Phase.PLAYING || state.phase === Phase.SLAP_WINDOW) {
          state.showExitConfirm = true; render();
        } else {
          exitGame();
        }
        break;
      case 'exit-confirm-yes':
        exitGame(); break;
      case 'exit-confirm-no':
        state.showExitConfirm = false; render(); break;
      case 'resume-yes':
        if (state.savedSnapshot) restoreFromSnapshot(state.savedSnapshot);
        break;
      case 'resume-no':
        clearSaveState();
        state.savedSnapshot = null;
        state.phase = Phase.MENU; render(); break;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const key = e.key;

    const pi = PLAYER_KEYS.indexOf(key);
    if (pi >= 0 && pi < (state.players ? state.players.length : 0)) {
      e.preventDefault();
      handleSlap(pi);
      return;
    }

    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      if (state.phase === Phase.PLAYING) flipCard();
      return;
    }

    if (key === 'Escape') {
      if (state.phase === Phase.SETUP || state.phase === Phase.HOW_TO_PLAY) {
        state.phase = Phase.MENU; render();
      }
    }

    if (key === 'd' || key === 'D') {
      if (state.phase !== Phase.MENU && state.phase !== Phase.SETUP) {
        state.debug = !state.debug; render();
      }
    }
  });
}

function readSetupInputs() {
  const seedEl = document.getElementById('seed-input');
  if (seedEl) state.settings.seed = parseInt(seedEl.value) || 0;
}

function clearAllTimers() {
  if (slapTimeoutId) { clearTimeout(slapTimeoutId); slapTimeoutId = null; }
  cancelTimerAnimation();
}

// ── 11. Init ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  state = freshState();
  initEvents();
  const snap = loadSaveState();
  if (snap) {
    state.savedSnapshot = snap;
    state.phase = Phase.RESUME_PROMPT;
  }
  render();
});

// ── 12. Test Exports (Node.js) ───────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CFG, SlapCond, Phase, FAMILIES, JOKER_DEFS, PLAYER_COLORS, SAVE_KEY,
    mulberry32, shuffle, generateDeck, isIdenticalMatch,
    evaluateSlapCondition, freshState, addLog, pname,
    startGame, flipCard, openSlapWindow, handleSlap, resolveSlapWindow,
    pickupPile, advanceToNext, checkGameOver,
    saveState, clearSaveState, loadSaveState, restoreFromSnapshot,
    isSafeReturnPath, getBasePath, exitGame,
    renderCardSvg, cardBackSvg, jokerSvg,
    getState: () => state,
    setState: (s) => { state = s; },
  };
}
