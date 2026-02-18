const BOARD_SIZE = 8;
const ZONE_START = BOARD_SIZE / 2 - 1;
const ZONE_END = ZONE_START + 1;
const ZONE_ANCHOR = { row: ZONE_START, col: ZONE_START };
const ZONE_SAFE_TURNS = 2;
const STARTER_COUNT = 6;
const STOCK_PER_SHAPE = 4;
const SHAPES = ["circle", "triangle", "square"];
const SHAPE_ICONS = {
  circle: "◯",
  triangle: "▲",
  square: "■",
};

const SIDES = ["south", "north", "west", "east"];

const COLOR_CLASS = {
  south: "white",
  north: "black",
  west: "red",
  east: "blue",
};

const boardEl = document.getElementById("board");
const turnInfoEl = document.getElementById("turnInfo");
const statusEl = document.getElementById("status");
const supplyListEl = document.getElementById("supplyList");
const starterInfoEl = document.getElementById("starterInfo");
const lockStartersBtn = document.getElementById("lockStarters");
const starterModeSelect = document.getElementById("starterMode");
const DEFAULT_STARTER_MODE = "turn";

const localPlayersSelect = document.getElementById("localPlayers");
const botCountSelect = document.getElementById("botCount");
const aiSpeedBlock = document.getElementById("aiSpeedBlock");
const aiSpeedSelect = document.getElementById("aiSpeed");
const aiDifficultyBlock = document.getElementById("aiDifficultyBlock");
const aiDifficultySelect = document.getElementById("aiDifficulty");
const newGameBtn = document.getElementById("newGame");
const cancelActionBtn = document.getElementById("cancelAction");
const placeBtns = Array.from(document.querySelectorAll(".place-btn"));
const feedbackBtn = document.getElementById("feedbackBtn");
const winModalEl = document.getElementById("winModal");
const winMessageEl = document.getElementById("winMessage");
const winActionBtn = document.getElementById("winAction");
const playtestGateEl = document.getElementById("playtestGate");
const playtestAgreeBtn = document.getElementById("playtestAgree");

let state = null;
let aiTimer = null;
let feedbackRetryTimer = null;
let feedbackQueueBusy = false;
let feedbackQueueMemory = [];

const FEEDBACK_QUEUE_KEY_LOCAL = "elam_feedback_queue_local_v1";
const FEEDBACK_QUEUE_MAX = 400;
const FEEDBACK_RETRY_MS = 15000;
const PLAYTEST_GATE_ACK_KEY = "elam_playtest_notice_ack_v1";

const AI_PROFILES = [
  {
    name: "Hunter",
    description: "Aggressive chaser. Prioritizes captures and flag carriers.",
    starterWeights: { circle: 1.3, triangle: 1.2, square: 0.8 },
    weights: {
      advance: 1.6,
      capture: 2.6,
      flag: 2.2,
      home: 2.0,
      build: 0.4,
      support: 0.6,
      risk: 1.2,
      zone: 1.1,
      intercept: 2.4,
    },
    randomness: 0.8,
  },
  {
    name: "Builder",
    description: "Stacks up and advances steadily.",
    starterWeights: { circle: 1.0, triangle: 1.0, square: 1.0 },
    weights: {
      advance: 1.4,
      capture: 1.4,
      flag: 1.8,
      home: 1.6,
      build: 1.8,
      support: 0.8,
      risk: 1.0,
      zone: 1.0,
      intercept: 1.1,
    },
    randomness: 0.6,
  },
  {
    name: "Opportunist",
    description: "Opens with placements, then looks for tactical swings.",
    starterWeights: { circle: 0.9, triangle: 1.3, square: 0.9 },
    weights: {
      advance: 1.2,
      capture: 2.0,
      flag: 2.4,
      home: 1.6,
      build: 1.0,
      support: 0.6,
      risk: 0.9,
      zone: 1.4,
      intercept: 1.6,
    },
    randomness: 1.1,
  },
  {
    name: "Guardian",
    description: "Defensive escort for friendly flag carriers.",
    starterWeights: { circle: 0.9, triangle: 0.9, square: 1.3 },
    weights: {
      advance: 1.0,
      capture: 1.4,
      flag: 1.6,
      home: 1.8,
      build: 0.8,
      support: 1.8,
      risk: 1.6,
      zone: 1.2,
      intercept: 2.1,
    },
    randomness: 0.5,
  },
];

const COMPETITIVE_AI_PROFILE = {
  name: "Competitive",
  description: "Single strongest strategy profile used for hard/competitive bots.",
  starterWeights: { circle: 1.1, triangle: 1.1, square: 1.1 },
  weights: {
    advance: 1.9,
    capture: 3.0,
    flag: 2.8,
    home: 2.9,
    build: 0.7,
    support: 1.1,
    risk: 1.8,
    zone: 1.5,
    intercept: 3.1,
  },
  randomness: 0.0,
};

const AI_DIFFICULTY_SETTINGS = {
  easy: {
    topN: 7,
    scoreJitter: 3.4,
    blunderChance: 0.34,
    blunderTopN: 12,
  },
  normal: {
    topN: 3,
    scoreJitter: 0.9,
    blunderChance: 0.07,
    blunderTopN: 6,
  },
  hard: {
    topN: 1,
    scoreJitter: 0.0,
    blunderChance: 0.0,
    blunderTopN: 1,
  },
  competitive: {
    topN: 1,
    scoreJitter: 0.0,
    blunderChance: 0.0,
    blunderTopN: 1,
  },
};

const AI_DIFFICULTY_WEIGHT_MODS = {
  easy: {
    objective: 0.82,
    capture: 0.82,
    home: 0.82,
    intercept: 0.75,
    risk: 0.58,
    zone: 0.85,
    build: 0.9,
  },
  normal: {
    objective: 1.0,
    capture: 1.0,
    home: 1.0,
    intercept: 1.0,
    risk: 1.0,
    zone: 1.0,
    build: 1.0,
  },
  hard: {
    objective: 1.24,
    capture: 1.18,
    home: 1.3,
    intercept: 1.5,
    risk: 1.35,
    zone: 1.2,
    build: 1.05,
  },
  competitive: {
    objective: 1.45,
    capture: 1.4,
    home: 1.55,
    intercept: 1.8,
    risk: 1.6,
    zone: 1.35,
    build: 1.1,
  },
};

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
}

function centerSquare() {
  // Anchor for the 2x2 flag zone.
  return { row: ZONE_ANCHOR.row, col: ZONE_ANCHOR.col };
}

function isZoneSquare(row, col) {
  return row >= ZONE_START && row <= ZONE_END && col >= ZONE_START && col <= ZONE_END;
}

function zoneSquares() {
  return [
    { row: ZONE_START, col: ZONE_START },
    { row: ZONE_START, col: ZONE_END },
    { row: ZONE_END, col: ZONE_START },
    { row: ZONE_END, col: ZONE_END },
  ];
}

function isAdjacentToZone(row, col) {
  for (const sq of zoneSquares()) {
    if (Math.max(Math.abs(row - sq.row), Math.abs(col - sq.col)) === 1) return true;
  }
  return false;
}

function buildPlayers(config) {
  const localOpponents = Math.max(0, Math.min(3, Number(config && config.localOpponents) || 0));
  const localPlayers = 1 + localOpponents;
  const maxBots = Math.max(0, 4 - localPlayers);
  const botCount = Math.max(0, Math.min(maxBots, Number(config && config.botCount) || 0));
  const players = [];

  for (let i = 0; i < localPlayers; i++) {
    players.push({
      id: `P${i + 1}`,
      name: i === 0 ? "You" : `Player ${i + 1}`,
      side: SIDES[i],
      isAI: false,
    });
  }

  for (let i = 0; i < botCount; i++) {
    const side = SIDES[localPlayers + i];
    players.push({
      id: `AI${i + 1}`,
      name: `Bot ${side[0].toUpperCase()}${side.slice(1)}`,
      side,
      isAI: true,
    });
  }

  return players;
}

function homeSquaresFor(side) {
  const squares = [];
  if (side === "south") {
    const r = BOARD_SIZE - 1;
    for (let c = 0; c < BOARD_SIZE; c++) squares.push({ row: r, col: c });
  } else if (side === "north") {
    const r = 0;
    for (let c = 0; c < BOARD_SIZE; c++) squares.push({ row: r, col: c });
  } else if (side === "west") {
    const c = 0;
    for (let r = 0; r < BOARD_SIZE; r++) squares.push({ row: r, col: c });
  } else if (side === "east") {
    const c = BOARD_SIZE - 1;
    for (let r = 0; r < BOARD_SIZE; r++) squares.push({ row: r, col: c });
  }
  return squares;
}

function isHomeSquare(side, row, col) {
  if (side === "south") return row === BOARD_SIZE - 1;
  if (side === "north") return row === 0;
  if (side === "west") return col === 0;
  if (side === "east") return col === BOARD_SIZE - 1;
  return false;
}

function oppositeSide(side) {
  if (side === "south") return "north";
  if (side === "north") return "south";
  if (side === "west") return "east";
  if (side === "east") return "west";
  return side;
}

function isOppositeSquare(side, row, col) {
  return isHomeSquare(oppositeSide(side), row, col);
}

function initStarterTracking(players) {
  const placedBy = {};
  const countsBy = {};
  players.forEach((p) => {
    placedBy[p.id] = 0;
    countsBy[p.id] = { circle: 0, triangle: 0, square: 0 };
  });
  return { placedBy, countsBy };
}

function initialState(config, setupMode) {
  const players = buildPlayers(config);
  assignAiProfiles(players);
  const supplies = {};
  players.forEach((p) => {
    supplies[p.id] = { circle: STOCK_PER_SHAPE, triangle: STOCK_PER_SHAPE, square: STOCK_PER_SHAPE };
  });
  const tracking = initStarterTracking(players);
  const primaryHuman = players.find((p) => !p.isAI) || players[0];
  const localPlayers = players.filter((p) => !p.isAI).length;
  const botCount = players.length - localPlayers;
  const gameMode = botCount === 0 ? "hotseat" : localPlayers > 1 ? "mixed" : "solo-vs-bots";
  const requestedSetupMode = setupMode === "hidden" ? "hidden" : "turn";
  // Hidden lock-in requires a single local human seat in this client.
  const resolvedSetupMode = localPlayers > 1 && requestedSetupMode === "hidden" ? "turn" : requestedSetupMode;
  const base = {
    board: createEmptyBoard(),
    flag: { zone: true, row: null, col: null, carriedBy: null },
    flagZone: { stack: null, holdTurns: 0 },
    players,
    gameMode,
    localPlayers,
    botCount,
    primaryHumanId: primaryHuman.id,
    supplies,
    current: 0,
    selected: null,
    placingShape: null,
    gameOver: false,
    winner: null,
    lastMessage: "New game. Your move!",
    phase: "setup",
    setupMode: resolvedSetupMode,
    starterPlacedBy: tracking.placedBy,
    starterCountsBy: tracking.countsBy,
    startersPlaced: 0,
    starterCounts: tracking.countsBy[primaryHuman.id],
    aiDifficulty: String(config && config.aiDifficulty ? config.aiDifficulty : "normal"),
  };
  logDev("AI profiles assigned. Game initialized.");
  return base;
}

function currentPlayer() {
  return state.players[state.current];
}

function shapeBeats(a, b) {
  return (
    (a === "circle" && b === "triangle") ||
    (a === "triangle" && b === "square") ||
    (a === "square" && b === "circle")
  );
}

function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function cellAt(row, col) {
  if (isZoneSquare(row, col)) return null;
  return state.board[row][col];
}

function setCell(row, col, value) {
  if (isZoneSquare(row, col)) return;
  state.board[row][col] = value;
}

function clearSelection() {
  state.selected = null;
  state.placingShape = null;
  render();
}

function keyFor(row, col) {
  return `${row},${col}`;
}

function computeLegalTargetsForSelection() {
  if (!state || !state.selected || state.phase !== "play") return null;
  const player = currentPlayer();
  if (!player || player.isAI) return null;

  const targets = new Set();

  if (state.selected.inZone) {
    const zoneStack = state.flagZone.stack;
    if (!zoneStack || zoneStack.playerId !== player.id) return targets;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!isAdjacentToZone(r, c)) continue;
        const evalMove = validMoveFromZone(zoneStack, r, c);
        if (evalMove.ok) targets.add(keyFor(r, c));
      }
    }
    return targets;
  }

  const stack = cellAt(state.selected.row, state.selected.col);
  if (!stack || stack.playerId !== player.id) return targets;

  const h = maxMoveForStack(stack);
  for (let dr = -h; dr <= h; dr++) {
    for (let dc = -h; dc <= h; dc++) {
      if (dr === 0 && dc === 0) continue;
      if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) continue;
      const r = state.selected.row + dr;
      const c = state.selected.col + dc;
      if (!inBounds(r, c)) continue;
      const evalMove = validMove(stack, state.selected.row, state.selected.col, r, c);
      if (evalMove.ok) targets.add(keyFor(r, c));
    }
  }

  const zoneMove = validMoveToZone(stack, state.selected.row, state.selected.col);
  if (zoneMove.ok) {
    zoneSquares().forEach((sq) => targets.add(keyFor(sq.row, sq.col)));
  }

  return targets;
}

function renderBoard() {
  boardEl.innerHTML = "";
  const zoneOverlay = document.createElement("div");
  zoneOverlay.className = "flag-zone-overlay";
  zoneOverlay.innerHTML = `
    <div class="flag-zone-frame">
      <div class="flag-zone-center"></div>
    </div>
    <div class="flag-zone-label">FLAG ZONE</div>
  `;
  boardEl.appendChild(zoneOverlay);

  const legalTargets = computeLegalTargetsForSelection();
  const player = currentPlayer();
  const showWinEdge =
    state &&
    state.phase === "play" &&
    player &&
    !player.isAI &&
    state.flag &&
    state.flag.carriedBy === player.id;
  const winEdgeSquares = showWinEdge ? homeSquaresFor(oppositeSide(player.side)) : [];
  const winEdge = new Set(winEdgeSquares.map((sq) => keyFor(sq.row, sq.col)));

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement("div");
      const inZone = isZoneSquare(r, c);
      cell.className =
        "cell" +
        ((r + c) % 2 === 0 ? "" : " dark") +
        (inZone ? " zone" : "");
      if (inZone && r === ZONE_ANCHOR.row && c === ZONE_ANCHOR.col) {
        cell.classList.add("zone-anchor");
      }
      cell.dataset.row = r;
      cell.dataset.col = c;

      let stack = cellAt(r, c);
      if (inZone && r === ZONE_ANCHOR.row && c === ZONE_ANCHOR.col) {
        stack = state.flagZone.stack;
      }
      const hasFlag =
        state.flag.carriedBy === null &&
        ((state.flag.zone && r === ZONE_ANCHOR.row && c === ZONE_ANCHOR.col) ||
          (!state.flag.zone && state.flag.row === r && state.flag.col === c));

      if (stack) {
        const div = document.createElement("div");
        div.className = `stack ${COLOR_CLASS[playerById(stack.playerId).side]}`;
        div.innerHTML = `
          <div class="shape">${SHAPE_ICONS[stack.shape]}</div>
          <div class="height">x${stack.height}</div>
        `;
        if (stack.hasFlag) {
          const f = document.createElement("div");
          f.className = "flag";
          div.appendChild(f);
        }
        cell.appendChild(div);
      }
      if (hasFlag) {
        const f = document.createElement("div");
        f.className = "flag";
        cell.appendChild(f);
      }
      if (
        state.selected &&
        ((state.selected.inZone && r === ZONE_ANCHOR.row && c === ZONE_ANCHOR.col) ||
          (!state.selected.inZone && state.selected.row === r && state.selected.col === c))
      ) {
        cell.classList.add("highlight");
      }
      if (winEdge.has(keyFor(r, c))) {
        cell.classList.add("win-edge");
      }
      if (legalTargets && legalTargets.has(keyFor(r, c))) {
        cell.classList.add("target");
      }
      boardEl.appendChild(cell);
    }
  }
}

function renderSupplies() {
  supplyListEl.innerHTML = "";
  state.players.forEach((p) => {
    const card = document.createElement("div");
    card.className = "supply-card";
    const sup = state.supplies[p.id];
    const playerDiv = document.createElement("div");
    playerDiv.className = "player";
    playerDiv.textContent = `${p.name} (${p.side})`;
    card.appendChild(playerDiv);
    for (const [label, val] of [["Circle", sup.circle], ["Triangle", sup.triangle], ["Square", sup.square]]) {
      const row = document.createElement("div");
      row.className = "supply-row";
      const lbl = document.createElement("span");
      lbl.textContent = label;
      const v = document.createElement("span");
      v.textContent = String(val);
      row.append(lbl, v);
      card.appendChild(row);
    }
    supplyListEl.appendChild(card);
  });
}

function renderStarters() {
  if (!starterInfoEl || !lockStartersBtn) return;
  if (state.phase !== "setup") {
    starterInfoEl.textContent = "Starters locked.";
    lockStartersBtn.disabled = true;
    return;
  }
  if (state.setupMode === "turn") {
    const p = currentPlayer();
    const counts = state.starterCountsBy[p.id];
    const placed = state.starterPlacedBy[p.id] || 0;
    starterInfoEl.textContent =
      `Turn-based (${p.name}): ${placed}/${STARTER_COUNT} | ` +
      `C${counts.circle} T${counts.triangle} S${counts.square} (min 1 each)`;
    lockStartersBtn.disabled = true;
    return;
  }
  const counts = state.starterCounts;
  starterInfoEl.textContent =
    `Placed ${state.startersPlaced}/${STARTER_COUNT} | ` +
    `C${counts.circle} T${counts.triangle} S${counts.square} (min 1 each)`;
  const ready =
    state.startersPlaced === STARTER_COUNT &&
    counts.circle >= 1 &&
    counts.triangle >= 1 &&
    counts.square >= 1;
  lockStartersBtn.disabled = !ready;
}

function renderHud() {
  const p = currentPlayer();
  turnInfoEl.textContent = state.gameOver
    ? `Game over: ${state.winner}`
    : state.phase === "setup"
    ? state.setupMode === "turn"
      ? `${p.name} placing starter (${(state.starterPlacedBy[p.id] || 0) + 1}/${STARTER_COUNT})`
      : `Hidden setup: ${state.startersPlaced}/${STARTER_COUNT} starters placed`
    : `${p.name}'s turn (${p.side}${p.isAI ? ", AI" : ""})`;
  statusEl.textContent = state.lastMessage;
  if (winModalEl && winMessageEl) {
    if (state.gameOver) {
      winMessageEl.textContent = state.winner || "Game over.";
      winModalEl.classList.remove("is-hidden");
    } else {
      winModalEl.classList.add("is-hidden");
    }
  }
}

function render() {
  enforceWinFromCarrierPosition();
  renderBoard();
  renderSupplies();
  renderStarters();
  renderHud();
}

function playerById(id) {
  return state.players.find((p) => p.id === id);
}

function canPlace(player, shape, row, col) {
  if (isZoneSquare(row, col)) return false;
  if (!isHomeSquare(player.side, row, col)) return false;
  if (state.supplies[player.id][shape] <= 0) return false;
  const target = cellAt(row, col);
  if (!target) return true;
  if (target.playerId !== player.id) return false;
  return target.shape === shape;
}

function placePiece(player, shape, row, col) {
  if (!canPlace(player, shape, row, col)) {
    state.lastMessage = "Placement not allowed on that square.";
    return false;
  }
  const target = cellAt(row, col);
  if (!target) {
    setCell(row, col, {
      playerId: player.id,
      shape,
      height: 1,
      hasFlag: false,
    });
  } else {
    target.height += 1;
  }
  state.supplies[player.id][shape] -= 1;
  state.lastMessage = `${player.name} placed a ${shape}.`;
  return true;
}

function starterRemaining(player) {
  return STARTER_COUNT - (state.starterPlacedBy[player.id] || 0);
}

function canMeetStarterMinimum(player, shape) {
  const counts = state.starterCountsBy[player.id];
  const placed = state.starterPlacedBy[player.id] || 0;
  const projected = { ...counts };
  projected[shape] += 1;
  const remainingSlots = STARTER_COUNT - (placed + 1);
  const missing = SHAPES.filter((s) => projected[s] === 0).length;
  return missing <= remainingSlots;
}

function recordStarterPlacement(player, shape) {
  state.starterPlacedBy[player.id] += 1;
  state.starterCountsBy[player.id][shape] += 1;
  if (player.id === state.primaryHumanId) {
    state.startersPlaced = state.starterPlacedBy[player.id];
    state.starterCounts = state.starterCountsBy[player.id];
  }
}

function placeStarterAt(player, shape, row, col, silent) {
  if (starterRemaining(player) <= 0) {
    state.lastMessage = "All starters already placed.";
    return false;
  }
  if (!canMeetStarterMinimum(player, shape)) {
    state.lastMessage = "Need at least 1 of each shape in your 6 starters.";
    return false;
  }
  const prior = state.lastMessage;
  const ok = placePiece(player, shape, row, col);
  if (!ok) return false;
  recordStarterPlacement(player, shape);
  if (silent) state.lastMessage = prior;
  return true;
}

function placeStarter(player, shape, row, col) {
  return placeStarterAt(player, shape, row, col, false);
}

function lockStarters() {
  if (state.phase !== "setup") return;
  if (state.setupMode !== "hidden") {
    state.lastMessage = "Turn-based setup locks automatically.";
    render();
    return;
  }
  const counts = state.starterCounts;
  const ready =
    state.startersPlaced === STARTER_COUNT &&
    counts.circle >= 1 &&
    counts.triangle >= 1 &&
    counts.square >= 1;
  if (!ready) {
    state.lastMessage = "Place 6 starters with at least 1 of each shape before locking.";
    render();
    return;
  }

  logDev(
    `Player starters locked: C${counts.circle} T${counts.triangle} S${counts.square}.`
  );

  initAiStarterPlans(false);
  state.players.forEach((p) => {
    if (!p.isAI) return;
    const plan = p.starterPlan;
    placeStarters(p, plan.counts, plan.pattern);
    logDev(
      `${p.name} starters: C${plan.counts.circle} T${plan.counts.triangle} S${plan.counts.square} (${plan.pattern}, ${plan.strategy.name}).`
    );
  });

  state.phase = "play";
  state.selected = null;
  state.placingShape = null;
  state.lastMessage = "Starters locked. Game begins!";
  render();
  maybeRunAI();
}

function direction(fromRow, fromCol, toRow, toCol) {
  const dr = Math.sign(toRow - fromRow);
  const dc = Math.sign(toCol - fromCol);
  return { dr, dc };
}

function distance(fromRow, fromCol, toRow, toCol) {
  return Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol));
}

function maxMoveForStack(stack) {
  if (!stack || !stack.hasFlag) return stack ? stack.height : 0;
  return Math.max(1, Math.floor(stack.height / 2));
}

function pathClear(stack, fromRow, fromCol, toRow, toCol) {
  const { dr, dc } = direction(fromRow, fromCol, toRow, toCol);
  let r = fromRow + dr;
  let c = fromCol + dc;
  while (r !== toRow || c !== toCol) {
    if (isZoneSquare(r, c)) return false; // cannot pass through flag zone
    const cell = cellAt(r, c);
    if (cell && cell.playerId !== stack.playerId && cell.shape === stack.shape) {
      return false; // blocked by opposing same shape
    }
    r += dr;
    c += dc;
  }
  return true;
}

function validMove(stack, fromRow, fromCol, toRow, toCol) {
  if (isZoneSquare(toRow, toCol)) {
    return validMoveToZone(stack, fromRow, fromCol);
  }
  if (!inBounds(toRow, toCol)) return { ok: false, reason: "Out of bounds" };
  const dist = distance(fromRow, fromCol, toRow, toCol);
  if (dist === 0 || dist > maxMoveForStack(stack))
    return { ok: false, reason: "Too far" };
  const straight = fromRow === toRow || fromCol === toCol;
  const diag = Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol);
  if (!straight && !diag) return { ok: false, reason: "Must move straight or diagonal" };
  if (!pathClear(stack, fromRow, fromCol, toRow, toCol))
    return { ok: false, reason: "Blocked by opposing same shape" };

  const dest = cellAt(toRow, toCol);
  if (!dest) return { ok: true, type: "move" };

  if (dest.playerId === stack.playerId) {
    if (dest.shape !== stack.shape)
      return { ok: false, reason: "Cannot stack different shapes" };
    return { ok: true, type: "merge" };
  }

  // enemy piece
  if (dest.shape === stack.shape)
    return { ok: false, reason: "Same shape blocks" };
  if (!shapeBeats(stack.shape, dest.shape))
    return { ok: false, reason: "Loses combat" };
  return { ok: true, type: "capture", destHasFlag: dest.hasFlag };
}

function canReachZoneSquare(stack, fromRow, fromCol) {
  const maxMove = maxMoveForStack(stack);
  for (const sq of zoneSquares()) {
    const straight = fromRow === sq.row || fromCol === sq.col;
    const diag = Math.abs(sq.row - fromRow) === Math.abs(sq.col - fromCol);
    if (!straight && !diag) continue;
    const dist = distance(fromRow, fromCol, sq.row, sq.col);
    if (dist === 0 || dist > maxMove) continue;
    if (!pathClear(stack, fromRow, fromCol, sq.row, sq.col)) continue;
    return true;
  }
  return false;
}

function validMoveToZone(stack, fromRow, fromCol) {
  if (!canReachZoneSquare(stack, fromRow, fromCol)) {
    return { ok: false, reason: "Cannot reach flag zone" };
  }
  const zoneStack = state.flagZone.stack;
  if (!zoneStack) return { ok: true, type: "enter" };
  if (zoneStack.playerId === stack.playerId) {
    if (zoneStack.shape !== stack.shape) {
      return { ok: false, reason: "Cannot merge different shapes in zone" };
    }
    return { ok: true, type: "merge" };
  }
  if (zoneStack.hasFlag && state.flagZone.holdTurns < ZONE_SAFE_TURNS) {
    return { ok: false, reason: "Flag carrier is safe in the zone" };
  }
  if (zoneStack.shape === stack.shape)
    return { ok: false, reason: "Same shape blocks" };
  if (!shapeBeats(stack.shape, zoneStack.shape))
    return { ok: false, reason: "Loses combat" };
  return { ok: true, type: "capture" };
}

function validMoveFromZone(stack, toRow, toCol) {
  if (!inBounds(toRow, toCol)) return { ok: false, reason: "Out of bounds" };
  if (isZoneSquare(toRow, toCol))
    return { ok: false, reason: "Must exit the flag zone" };
  if (!isAdjacentToZone(toRow, toCol))
    return { ok: false, reason: "Must exit to an adjacent square" };
  const dest = cellAt(toRow, toCol);
  if (!dest) return { ok: true, type: "move" };
  if (dest.playerId === stack.playerId) {
    if (dest.shape !== stack.shape)
      return { ok: false, reason: "Cannot stack different shapes" };
    return { ok: true, type: "merge" };
  }
  if (dest.shape === stack.shape)
    return { ok: false, reason: "Same shape blocks" };
  if (!shapeBeats(stack.shape, dest.shape))
    return { ok: false, reason: "Loses combat" };
  return { ok: true, type: "capture", destHasFlag: dest.hasFlag };
}

function moveStack(fromRow, fromCol, toRow, toCol) {
  const stack = cellAt(fromRow, fromCol);
  if (!stack) return false;
  if (isZoneSquare(toRow, toCol)) {
    return moveToZone(fromRow, fromCol);
  }
  const evalMove = validMove(stack, fromRow, fromCol, toRow, toCol);
  if (!evalMove.ok) {
    state.lastMessage = evalMove.reason;
    return false;
  }
  setCell(fromRow, fromCol, null);

  if (evalMove.type === "move") {
    const newStack = { ...stack };
    setCell(toRow, toCol, newStack);
    state.lastMessage = "Stack moved.";
    afterMoveFlagHandling(newStack, { row: toRow, col: toCol, inZone: false });
    return true;
  }

  if (evalMove.type === "merge") {
    const dest = cellAt(toRow, toCol);
    dest.height += stack.height;
    const combinedFlag = dest.hasFlag || stack.hasFlag;
    dest.hasFlag = combinedFlag;
    if (combinedFlag) {
      state.flag = { zone: false, row: toRow, col: toCol, carriedBy: dest.playerId };
    }
    state.lastMessage = "Stacks merged.";
    afterMoveFlagHandling(dest, { row: toRow, col: toCol, inZone: false });
    return true;
  }

  if (evalMove.type === "capture") {
    const dest = cellAt(toRow, toCol);
    const capturedHadFlag = dest.hasFlag;
    // Remove captured stack
    setCell(toRow, toCol, null);
    const newStack = { ...stack };
    setCell(toRow, toCol, newStack);
    if (capturedHadFlag) {
      // Flag drops, then attacker auto-picks by standing on the square.
      state.flag = { zone: false, row: toRow, col: toCol, carriedBy: newStack.playerId };
      newStack.hasFlag = true;
    }
    state.lastMessage = "Capture successful.";
    afterMoveFlagHandling(newStack, { row: toRow, col: toCol, inZone: false });
    return true;
  }
  return false;
}

function moveToZone(fromRow, fromCol) {
  const stack = cellAt(fromRow, fromCol);
  if (!stack) return false;
  const evalMove = validMoveToZone(stack, fromRow, fromCol);
  if (!evalMove.ok) {
    state.lastMessage = evalMove.reason;
    return false;
  }
  setCell(fromRow, fromCol, null);
  const zoneStack = state.flagZone.stack;
  if (!zoneStack) {
    state.flagZone.stack = { ...stack };
    state.flagZone.holdTurns = 0;
  } else if (evalMove.type === "merge") {
    zoneStack.height += stack.height;
    zoneStack.hasFlag = zoneStack.hasFlag || stack.hasFlag;
  } else if (evalMove.type === "capture") {
    state.flagZone.stack = { ...stack };
    state.flagZone.holdTurns = 0;
  }

  const finalStack = state.flagZone.stack;
  const capturedHadFlag = zoneStack ? zoneStack.hasFlag : false;
  if (capturedHadFlag) {
    finalStack.hasFlag = true;
  }
  if (stack.hasFlag) {
    finalStack.hasFlag = true;
  }
  if (state.flag.zone && state.flag.carriedBy === null) {
    finalStack.hasFlag = true;
  }
  if (finalStack.hasFlag) {
    state.flag = { zone: true, row: null, col: null, carriedBy: finalStack.playerId };
  }
  state.lastMessage =
    evalMove.type === "capture"
      ? "Captured in flag zone."
      : evalMove.type === "merge"
      ? "Merged in flag zone."
      : "Entered flag zone.";
  afterMoveFlagHandling(finalStack, { inZone: true });
  return true;
}

function moveFromZone(toRow, toCol) {
  const zoneStack = state.flagZone.stack;
  if (!zoneStack) return false;
  const evalMove = validMoveFromZone(zoneStack, toRow, toCol);
  if (!evalMove.ok) {
    state.lastMessage = evalMove.reason;
    return false;
  }

  state.flagZone.stack = null;
  state.flagZone.holdTurns = 0;
  const dest = cellAt(toRow, toCol);
  const capturedHadFlag = dest ? dest.hasFlag : false;
  if (!dest) {
    setCell(toRow, toCol, { ...zoneStack });
  } else if (evalMove.type === "merge") {
    dest.height += zoneStack.height;
    dest.hasFlag = dest.hasFlag || zoneStack.hasFlag;
  } else if (evalMove.type === "capture") {
    setCell(toRow, toCol, { ...zoneStack });
  }

  const finalStack = cellAt(toRow, toCol);
  if (zoneStack.hasFlag || capturedHadFlag) {
    finalStack.hasFlag = true;
    state.flag = { zone: false, row: toRow, col: toCol, carriedBy: finalStack.playerId };
  }

  state.lastMessage =
    evalMove.type === "capture"
      ? "Captured on exit from flag zone."
      : evalMove.type === "merge"
      ? "Merged on exit from flag zone."
      : "Exited flag zone.";
  afterMoveFlagHandling(finalStack, { row: toRow, col: toCol, inZone: false });
  return true;
}

function afterMoveFlagHandling(stack, loc) {
  const inZone = loc.inZone === true;
  const row = loc.row;
  const col = loc.col;

  // Pick up neutral flag on board.
  if (
    !stack.hasFlag &&
    !inZone &&
    state.flag.carriedBy === null &&
    !state.flag.zone &&
    state.flag.row === row &&
    state.flag.col === col
  ) {
    stack.hasFlag = true;
    state.flag = { zone: false, row, col, carriedBy: stack.playerId };
  }

  if (stack.hasFlag) {
    state.flag = inZone
      ? { zone: true, row: null, col: null, carriedBy: stack.playerId }
      : { zone: false, row, col, carriedBy: stack.playerId };
  }

  // Automatic hand-off if adjacent friendly carries flag and mover does not.
  if (!stack.hasFlag) {
    const carrier = findAdjacentFriendlyWithFlag(stack.playerId, loc);
    if (carrier) {
      carrier.stack.hasFlag = false;
      stack.hasFlag = true;
      state.flag = inZone
        ? { zone: true, row: null, col: null, carriedBy: stack.playerId }
        : { zone: false, row, col, carriedBy: stack.playerId };
      state.lastMessage = "Flag handed over to arriving stack.";
    }
  }

  checkWin(stack.playerId, loc);
}

function findAdjacentFriendlyWithFlag(playerId, loc) {
  if (loc.inZone) {
    // Adjacent squares around the zone.
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!isAdjacentToZone(r, c)) continue;
        const cell = cellAt(r, c);
        if (cell && cell.playerId === playerId && cell.hasFlag) {
          return { stack: cell, inZone: false };
        }
      }
    }
    return null;
  }

  const row = loc.row;
  const col = loc.col;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (!inBounds(r, c)) continue;
      const cell = cellAt(r, c);
      if (cell && cell.playerId === playerId && cell.hasFlag) {
        return { stack: cell, inZone: false };
      }
    }
  }
  const zoneStack = state.flagZone.stack;
  if (zoneStack && zoneStack.playerId === playerId && zoneStack.hasFlag && isAdjacentToZone(row, col)) {
    return { stack: zoneStack, inZone: true };
  }
  return null;
}

function locateFlagCarrier() {
  const zoneStack = state.flagZone.stack;
  if (zoneStack && zoneStack.hasFlag) {
    return {
      playerId: zoneStack.playerId,
      row: ZONE_ANCHOR.row,
      col: ZONE_ANCHOR.col,
      inZone: true,
    };
  }
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = cellAt(r, c);
      if (cell && cell.hasFlag) {
        return { playerId: cell.playerId, row: r, col: c, inZone: false };
      }
    }
  }
  return null;
}

function enforceWinFromCarrierPosition() {
  const carrier = locateFlagCarrier();
  if (!carrier) return;
  state.flag = carrier.inZone
    ? { zone: true, row: null, col: null, carriedBy: carrier.playerId }
    : { zone: false, row: carrier.row, col: carrier.col, carriedBy: carrier.playerId };
  if (state.gameOver || carrier.inZone) return;
  const player = playerById(carrier.playerId);
  if (!player) return;
  if (isOppositeSquare(player.side, carrier.row, carrier.col)) {
    state.gameOver = true;
    state.winner = `${player.name} wins by reaching the opposite edge with the flag!`;
    state.lastMessage = state.winner;
    trackGameEnd();
  }
}

function checkWin(playerId, loc) {
  const player = playerById(playerId);
  if (!player) return;
  if (state.flag.carriedBy !== playerId) return;
  if (loc.inZone) return;
  if (isOppositeSquare(player.side, loc.row, loc.col)) {
    state.gameOver = true;
    state.winner = `${player.name} wins by reaching the opposite edge with the flag!`;
    state.lastMessage = state.winner;
    trackGameEnd();
  }
}

function nextTurn() {
  gameActionCount += 1;
  enforceWinFromCarrierPosition();
  if (state.gameOver) {
    render();
    return;
  }
  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
  // Track how long the current flag carrier sits in the zone.
  const current = currentPlayer();
  if (state.flagZone.stack && state.flagZone.stack.playerId === current.id) {
    state.flagZone.holdTurns += 1;
  }
  state.selected = null;
  state.placingShape = null;
  state.current = (state.current + 1) % state.players.length;
  render();
  maybeRunAI();
}

function handleCellClick(e) {
  enforceWinFromCarrierPosition();
  if (state.gameOver) return;
  const player = currentPlayer();
  if (player.isAI) return; // ignore clicks during AI turn

  const cellEl = e.target.closest(".cell");
  if (!cellEl) return;
  const row = Number(cellEl.dataset.row);
  const col = Number(cellEl.dataset.col);
  const clickedZone = isZoneSquare(row, col);

  if (state.placingShape) {
    if (clickedZone) {
      state.lastMessage = "Cannot place on the flag zone.";
      render();
      return;
    }
    const ok =
      state.phase === "setup"
        ? placeStarter(player, state.placingShape, row, col)
        : placePiece(player, state.placingShape, row, col);
    if (ok) {
      if (state.phase === "setup") {
        state.placingShape = null;
        state.selected = null;
        state.lastMessage = "Starter placed.";
        if (state.setupMode === "turn") {
          advanceSetupTurn();
        } else {
          render();
        }
      } else {
        nextTurn();
      }
    } else {
      render();
    }
    return;
  }

  if (!state.selected) {
    if (state.phase === "setup") {
      state.lastMessage = state.setupMode === "hidden"
        ? "Pick a shape (circle/triangle/square) from the buttons below, then click a home-row square."
        : "Select a starter piece to place.";
      render();
      return;
    }
    if (clickedZone) {
      const zoneStack = state.flagZone.stack;
      if (zoneStack && zoneStack.playerId === player.id) {
        state.selected = { inZone: true };
        state.lastMessage = "Select a destination outside the flag zone.";
      } else {
        state.lastMessage = "No friendly stack in the flag zone.";
      }
      render();
      return;
    }
    const cell = cellAt(row, col);
    if (cell && cell.playerId === player.id) {
      state.selected = { row, col, inZone: false };
      if (cell.hasFlag) {
        const target = oppositeSide(player.side);
        state.lastMessage = `Select a destination. Win by reaching the ${target} edge while carrying the flag.`;
      } else {
        state.lastMessage = "Select a destination.";
      }
    } else {
      state.lastMessage = "Select one of your stacks to move.";
    }
    render();
    return;
  }

  // attempt move
  if (clickedZone) {
    const zoneStack = state.flagZone.stack;
    if (zoneStack && zoneStack.playerId === player.id) {
      let canMoveToZone = false;
      if (!state.selected.inZone) {
        const origin = cellAt(state.selected.row, state.selected.col);
        if (origin) {
          const evalToZone = validMoveToZone(origin, state.selected.row, state.selected.col);
          canMoveToZone = !!evalToZone.ok;
        }
      }
      if (!canMoveToZone) {
        state.selected = { inZone: true };
        state.lastMessage = "Selected stack in flag zone.";
        render();
        return;
      }
    }
  } else {
    const clickedStack = cellAt(row, col);
    if (clickedStack && clickedStack.playerId === player.id) {
      const sameSelected =
        !state.selected.inZone && state.selected.row === row && state.selected.col === col;
      let legalDestination = false;
      if (!sameSelected && !state.selected.inZone) {
        const origin = cellAt(state.selected.row, state.selected.col);
        if (origin) {
          const evalMove = validMove(origin, state.selected.row, state.selected.col, row, col);
          legalDestination = !!evalMove.ok;
        }
      }
      if (sameSelected || !legalDestination) {
        state.selected = { row, col, inZone: false };
        if (clickedStack.hasFlag) {
          const target = oppositeSide(player.side);
          state.lastMessage = `Selected flag carrier. Reach the ${target} edge to win.`;
        } else {
          state.lastMessage = "Selected stack. Choose destination.";
        }
        render();
        return;
      }
    }
  }

  // attempt move to destination
  if (state.selected.inZone) {
    if (clickedZone) {
      state.lastMessage = "Select a square adjacent to the flag zone.";
      render();
      return;
    }
    const moved = moveFromZone(row, col);
    if (moved) {
      nextTurn();
    } else {
      render();
    }
    return;
  }

  const { row: fromRow, col: fromCol } = state.selected;
  const moved = moveStack(fromRow, fromCol, row, col);
  if (moved) {
    nextTurn();
  } else {
    render();
  }
}

function selectPlacement(shape) {
  if (state.gameOver) return;
  const player = currentPlayer();
  if (player.isAI) return;
  if (state.phase === "setup" && starterRemaining(player) <= 0) {
    state.lastMessage =
      state.setupMode === "turn"
        ? `${player.name} already placed all starters.`
        : "All starters placed. Lock to begin.";
    render();
    return;
  }
  state.placingShape = shape;
  state.selected = null;
  state.lastMessage = `Placing ${shape}: click a home-row square.`;
  render();
}

function cancelAction() {
  clearSelection();
  state.lastMessage = "Action cancelled.";
  render();
}

function aiDelayMs() {
  const speed = aiSpeedSelect ? aiSpeedSelect.value : "normal";
  if (speed === "fast") return 80;
  if (speed === "slow") return 650;
  return 250;
}

function maybeRunAI() {
  if (state.gameOver) return;
  const player = currentPlayer();
  if (state.phase === "setup" && state.setupMode === "turn") {
    if (!player.isAI) return;
    if (aiTimer) clearTimeout(aiTimer);
    aiTimer = setTimeout(() => {
      aiTimer = null;
      runAiSetupTurn();
    }, aiDelayMs());
    return;
  }
  if (state.phase !== "play") return;
  if (!player.isAI) return;
  if (aiTimer) clearTimeout(aiTimer);
  aiTimer = setTimeout(() => {
    aiTimer = null;
    runAiTurn();
  }, aiDelayMs());
}

function runAiTurn() {
  if (state.gameOver) return;
  if (state.phase !== "play") return;
  const player = currentPlayer();
  if (!player) return;
  if (!player.isAI) return;

  try {
    const acted = aiAct(player);
    if (!acted) {
      state.lastMessage = `${player.name} passes (no moves).`;
      logDev(`${player.name} passes (no legal actions).`);
    }
    render();
    if (!state.gameOver) nextTurn();
  } catch (err) {
    logDev(`AI turn error for ${player.name}: ${err && err.message || err}`);
    // Force-advance so the game never freezes on a failed AI turn.
    state.selected = null;
    state.placingShape = null;
    state.lastMessage = `${player.name} passes (error recovery).`;
    state.current = (state.current + 1) % state.players.length;
    try { render(); } catch (_) { /* best effort */ }
    maybeRunAI();
  }
}

function runAiSetupTurn() {
  if (state.gameOver) return;
  if (state.phase !== "setup" || state.setupMode !== "turn") return;
  const player = currentPlayer();
  if (!player) return;
  if (!player.isAI) return;

  try {
    const plan = ensureAiStarterPlan(player);
    const weights =
      plan.strategy.name === "counter" ? counterWeights(state.starterCounts) : plan.strategy.weights;
    const shape = chooseStarterShapeFromRemaining(plan.remaining, weights);
    if (!shape) {
      state.lastMessage = `${player.name} has no starter placements left.`;
      advanceSetupTurn();
      return;
    }
    const placed = placeSingleStarterByPattern(player, shape, plan.pattern, plan.anchor);
    if (placed) {
      plan.remaining[shape] -= 1;
      state.lastMessage = `${player.name} placed a ${shape} starter.`;
    } else {
      state.lastMessage = `${player.name} could not place a ${shape} starter.`;
    }
    advanceSetupTurn();
  } catch (err) {
    logDev(`AI setup error for ${player.name}: ${err && err.message || err}`);
    state.lastMessage = `${player.name} skipped (error recovery).`;
    advanceSetupTurn();
  }
}

function difficultySettings() {
  const key = aiDifficultyKey();
  return AI_DIFFICULTY_SETTINGS[key] || AI_DIFFICULTY_SETTINGS.normal;
}

function difficultyWeightMods() {
  const key = aiDifficultyKey();
  return AI_DIFFICULTY_WEIGHT_MODS[key] || AI_DIFFICULTY_WEIGHT_MODS.normal;
}

function aiDifficultyKey() {
  return String(state && state.aiDifficulty ? state.aiDifficulty : "normal").toLowerCase();
}

function useCompetitiveProfile() {
  const key = aiDifficultyKey();
  return key === "hard" || key === "competitive";
}

function activeAiProfile(player) {
  if (useCompetitiveProfile()) return COMPETITIVE_AI_PROFILE;
  return player.aiProfile || AI_PROFILES[0];
}

function chooseAiCandidate(scored) {
  if (!scored.length) return null;
  const diff = difficultySettings();
  const jittered = scored.map((cand) => ({
    ...cand,
    adjustedScore: cand.score + (Math.random() - 0.5) * diff.scoreJitter,
  }));
  jittered.sort((a, b) => b.adjustedScore - a.adjustedScore);

  if (Math.random() < diff.blunderChance) {
    const n = Math.min(diff.blunderTopN, jittered.length);
    const pick = jittered[Math.floor(Math.random() * n)];
    return pick;
  }

  const n = Math.min(diff.topN, jittered.length);
  return jittered[Math.floor(Math.random() * n)];
}

function aiAct(player) {
  const candidates = [
    ...generateMoveCandidates(player),
    ...generatePlacementCandidates(player),
  ];
  if (candidates.length === 0) return false;

  const scored = candidates.map((cand) => ({
    ...cand,
    score: evaluateCandidate(player, cand),
  }));
  const selectedCandidate = chooseAiCandidate(scored);
  if (!selectedCandidate) return false;
  const executed = executeCandidate(player, selectedCandidate);
  if (executed) {
    logDev(describeAiChoice(player, selectedCandidate));
  }
  return executed;
}

function findCarrier(playerId) {
  const zoneStack = state.flagZone.stack;
  if (zoneStack && zoneStack.playerId === playerId && zoneStack.hasFlag) {
    return { row: ZONE_ANCHOR.row, col: ZONE_ANCHOR.col, stack: zoneStack, inZone: true };
  }
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = cellAt(r, c);
      if (cell && cell.playerId === playerId && cell.hasFlag) {
        return { row: r, col: c, stack: cell, inZone: false };
      }
    }
  }
  return null;
}

function getEnemyCarrier(playerId) {
  if (!state.flag.carriedBy || state.flag.carriedBy === playerId) return null;
  const carrier = findCarrier(state.flag.carriedBy);
  if (!carrier) return null;
  const carrierPlayer = playerById(state.flag.carriedBy);
  return { ...carrier, player: carrierPlayer };
}

function sameLoc(a, b) {
  if (a.inZone && b.inZone) return true;
  if (a.inZone || b.inZone) return false;
  return a.row === b.row && a.col === b.col;
}

function canCaptureTargetFrom(stack, fromLoc, targetLoc, targetStack) {
  if (fromLoc.inZone) {
    if (targetLoc.inZone) return false;
    const evalMove = validMoveFromZone(stack, targetLoc.row, targetLoc.col);
    return evalMove.ok && evalMove.type === "capture";
  }
  if (targetLoc.inZone) {
    const evalMove = validMoveToZone(stack, fromLoc.row, fromLoc.col);
    return evalMove.ok && evalMove.type === "capture";
  }
  const evalMove = validMove(stack, fromLoc.row, fromLoc.col, targetLoc.row, targetLoc.col);
  return evalMove.ok && evalMove.type === "capture";
}

function carrierWinningSquares(carrier) {
  if (!carrier || carrier.inZone) return [];
  const side = carrier.player ? carrier.player.side : null;
  if (!side) return [];
  const home = homeSquaresFor(oppositeSide(side));
  const wins = [];
  home.forEach((sq) => {
    const evalMove = validMove(carrier.stack, carrier.row, carrier.col, sq.row, sq.col);
    if (evalMove.ok) wins.push(sq);
  });
  return wins;
}

function generateMoveCandidates(player) {
  const stacks = friendlyStacks(player.id);
  const candidates = [];
  stacks.forEach((s) => {
    if (s.inZone) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (!isAdjacentToZone(r, c)) continue;
          const evalMove = validMoveFromZone(s.stack, r, c);
          if (!evalMove.ok) continue;
          const dest = cellAt(r, c);
          candidates.push({
            type: "move",
            fromRow: s.row,
            fromCol: s.col,
            toRow: r,
            toCol: c,
            fromInZone: true,
            toInZone: false,
            stack: s.stack,
            evalMove,
            dest,
          });
        }
      }
      return;
    }
    const h = maxMoveForStack(s.stack);
    for (let dr = -h; dr <= h; dr++) {
      for (let dc = -h; dc <= h; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) continue;
        const r = s.row + dr;
        const c = s.col + dc;
        if (!inBounds(r, c)) continue;
        if (isZoneSquare(r, c)) continue;
        const evalMove = validMove(s.stack, s.row, s.col, r, c);
        if (!evalMove.ok) continue;
        const dest = cellAt(r, c);
        candidates.push({
          type: "move",
          fromRow: s.row,
          fromCol: s.col,
          toRow: r,
          toCol: c,
          fromInZone: false,
          toInZone: false,
          stack: s.stack,
          evalMove,
          dest,
        });
      }
    }
    const zoneMove = validMoveToZone(s.stack, s.row, s.col);
    if (zoneMove.ok) {
      candidates.push({
        type: "move",
        fromRow: s.row,
        fromCol: s.col,
        toRow: ZONE_ANCHOR.row,
        toCol: ZONE_ANCHOR.col,
        fromInZone: false,
        toInZone: true,
        stack: s.stack,
        evalMove: zoneMove,
        dest: state.flagZone.stack,
      });
    }
  });
  return candidates;
}

function generatePlacementCandidates(player) {
  const candidates = [];
  SHAPES.forEach((shape) => {
    if (state.supplies[player.id][shape] <= 0) return;
    const home = homeSquaresFor(player.side);
    home.forEach((sq) => {
      if (canPlace(player, shape, sq.row, sq.col)) {
        candidates.push({
          type: "place",
          shape,
          row: sq.row,
          col: sq.col,
        });
      }
    });
  });
  return candidates;
}

function evaluateCandidate(player, cand) {
  const profile = activeAiProfile(player);
  const w = profile.weights;
  const mods = difficultyWeightMods();
  const difficultyKey = aiDifficultyKey();
  let score = 0;
  const objective = objectiveFor(player);
  const enemyCarrier = getEnemyCarrier(player.id);
  const carrierWinSquares = enemyCarrier ? carrierWinningSquares(enemyCarrier) : [];
  const carrierWinThreat = carrierWinSquares.length > 0;

  if (cand.type === "move") {
    const before = distanceToObjective(
      { row: cand.fromRow, col: cand.fromCol, inZone: cand.fromInZone },
      objective
    );
    const after = distanceToObjective(
      { row: cand.toRow, col: cand.toCol, inZone: cand.toInZone },
      objective
    );
    score += w.advance * mods.objective * (before - after);

    if (cand.evalMove.type === "capture") {
      const capHeight = cand.dest ? cand.dest.height : 1;
      const flagBonus = cand.dest && cand.dest.hasFlag ? 4 : 0;
      score += w.capture * mods.capture * (1 + capHeight * 0.4 + flagBonus);
    }
    if (cand.evalMove.type === "merge") score += w.build * mods.build * 1.2;

    if (
      state.flag.carriedBy === null &&
      ((state.flag.zone && cand.toInZone) ||
        (!state.flag.zone && cand.toRow === state.flag.row && cand.toCol === state.flag.col))
    ) {
      score += w.flag * mods.objective * 5;
    }

    if (cand.stack.hasFlag) {
      const fromRow = cand.fromInZone ? ZONE_ANCHOR.row : cand.fromRow;
      const fromCol = cand.fromInZone ? ZONE_ANCHOR.col : cand.fromCol;
      const toRow = cand.toInZone ? ZONE_ANCHOR.row : cand.toRow;
      const toCol = cand.toInZone ? ZONE_ANCHOR.col : cand.toCol;
      const homeBefore = distanceToHomeEdge(oppositeSide(player.side), fromRow, fromCol);
      const homeAfter = distanceToHomeEdge(oppositeSide(player.side), toRow, toCol);
      score += w.home * mods.home * (homeBefore - homeAfter) * 1.4;
    }

    const carrier = findCarrier(player.id);
    if (!cand.stack.hasFlag && carrier) {
      const carrierDist = distanceToObjective(
        { row: cand.toRow, col: cand.toCol, inZone: cand.toInZone },
        { row: carrier.row, col: carrier.col, inZone: carrier.inZone }
      );
      score += w.support * mods.objective * (3 - Math.min(3, carrierDist));
    }

    const risk = estimateCaptureRisk(
      player.id,
      cand.stack.shape,
      cand.toRow,
      cand.toCol,
      cand.toInZone
    );
    score -= w.risk * mods.risk * risk;

    if (state.flag.zone && state.flag.carriedBy === null) {
      if (cand.toInZone) score += w.zone * mods.zone * 4;
      if (!cand.toInZone && isAdjacentToZone(cand.toRow, cand.toCol)) score += w.zone * mods.zone;
    }

    if (enemyCarrier) {
      const carrierLoc = {
        row: enemyCarrier.row,
        col: enemyCarrier.col,
        inZone: enemyCarrier.inZone,
      };
      const afterDist = distanceToObjective(
        { row: cand.toRow, col: cand.toCol, inZone: cand.toInZone },
        carrierLoc
      );
      score +=
        w.intercept * mods.intercept * (3 - Math.min(3, afterDist)) * (carrierWinThreat ? 1.4 : 1.0);

      if (sameLoc({ row: cand.toRow, col: cand.toCol, inZone: cand.toInZone }, carrierLoc)) {
        if (cand.evalMove.type === "capture") {
          score += w.intercept * mods.intercept * 4;
        }
      } else if (canCaptureTargetFrom(
        cand.stack,
        { row: cand.toRow, col: cand.toCol, inZone: cand.toInZone },
        carrierLoc,
        enemyCarrier.stack
      )) {
        score += w.intercept * mods.intercept * 2;
      }

      if (!cand.toInZone && carrierWinThreat) {
        for (const sq of carrierWinSquares) {
          if (sq.row === cand.toRow && sq.col === cand.toCol) {
            if (!shapeBeats(enemyCarrier.stack.shape, cand.stack.shape)) {
              score += w.intercept * mods.intercept * 3;
            } else {
              score += w.intercept * mods.intercept * 1;
            }
            break;
          }
        }
      }
    }
  } else {
    const dist = distanceToObjective(
      { row: cand.row, col: cand.col, inZone: false },
      objective
    );
    score += w.advance * mods.objective * ((8 - dist) * 0.5);
    const cell = cellAt(cand.row, cand.col);
    if (cell && cell.playerId === player.id && cell.shape === cand.shape) {
      score += w.build * mods.build;
    }
    const nearby = adjacentEnemies(cand.row, cand.col, player.id);
    nearby.forEach((enemy) => {
      if (shapeBeats(cand.shape, enemy.shape)) score += w.capture * mods.capture * 0.4;
      if (shapeBeats(enemy.shape, cand.shape)) score -= w.risk * mods.risk * 0.3;
    });

    if (state.flag.zone && state.flag.carriedBy === null && isAdjacentToZone(cand.row, cand.col)) {
      score += w.zone * mods.zone * 0.6;
    }
    if (enemyCarrier && shapeBeats(cand.shape, enemyCarrier.stack.shape)) {
      const distToCarrier = distanceToObjective(
        { row: cand.row, col: cand.col, inZone: false },
        { row: enemyCarrier.row, col: enemyCarrier.col, inZone: enemyCarrier.inZone }
      );
      score += w.intercept * mods.intercept * (2 - Math.min(2, distToCarrier / 2));
    }
  }

  const randomnessScale =
    difficultyKey === "competitive" ? 0.0 : difficultyKey === "hard" ? 0.0 : difficultyKey === "easy" ? 1.35 : 1.0;
  const jitter = (Math.random() - 0.5) * profile.randomness * randomnessScale;
  return score + jitter;
}

function executeCandidate(player, cand) {
  if (cand.type === "move") {
    return moveStack(cand.fromRow, cand.fromCol, cand.toRow, cand.toCol);
  }
  return placePiece(player, cand.shape, cand.row, cand.col);
}

function describeAiChoice(player, cand) {
  const profile = activeAiProfile(player);
  if (cand.type === "move") {
    const action =
      cand.evalMove.type === "capture"
        ? "captures"
        : cand.evalMove.type === "merge"
        ? "merges"
        : "moves";
    return `${player.name} (${profile.name}) ${action} ${cand.stack.shape} from ${coord(cand.fromRow, cand.fromCol)} to ${coord(cand.toRow, cand.toCol)} [score ${cand.score.toFixed(2)}].`;
  }
  return `${player.name} (${profile.name}) places ${cand.shape} at ${coord(cand.row, cand.col)} [score ${cand.score.toFixed(2)}].`;
}

function objectiveFor(player) {
  if (state.flag.carriedBy === player.id) {
    return { ...homeTargetFor(oppositeSide(player.side)), inZone: false };
  }
  if (state.flag.carriedBy && state.flag.carriedBy !== player.id) {
    const carrier = findCarrier(state.flag.carriedBy);
    if (carrier) return { row: carrier.row, col: carrier.col, inZone: carrier.inZone };
  }
  if (state.flag.zone) {
    return { row: ZONE_ANCHOR.row, col: ZONE_ANCHOR.col, inZone: true };
  }
  return { row: state.flag.row, col: state.flag.col, inZone: false };
}

function homeTargetFor(side) {
  if (side === "south") return { row: BOARD_SIZE - 1, col: 3 };
  if (side === "north") return { row: 0, col: 3 };
  if (side === "west") return { row: 3, col: 0 };
  if (side === "east") return { row: 3, col: BOARD_SIZE - 1 };
  return { row: BOARD_SIZE - 1, col: 3 };
}

function distanceToHomeEdge(side, row, col) {
  if (side === "south") return BOARD_SIZE - 1 - row;
  if (side === "north") return row;
  if (side === "west") return col;
  if (side === "east") return BOARD_SIZE - 1 - col;
  return 0;
}

function estimateCaptureRisk(playerId, shape, row, col, destInZone) {
  let risk = 0;
  const zoneStack = state.flagZone.stack;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const enemy = cellAt(r, c);
      if (!enemy || enemy.playerId === playerId) continue;
      if (!shapeBeats(enemy.shape, shape)) continue;
      if (destInZone) {
        if (canReachZoneSquare(enemy, r, c)) {
          risk += 1 + enemy.height * 0.2;
        }
        continue;
      }
      const evalMove = validMove(enemy, r, c, row, col);
      if (evalMove.ok && evalMove.type === "capture") {
        risk += 1 + enemy.height * 0.2;
      }
    }
  }
  if (
    !destInZone &&
    zoneStack &&
    zoneStack.playerId !== playerId &&
    shapeBeats(zoneStack.shape, shape) &&
    isAdjacentToZone(row, col)
  ) {
    risk += 1 + zoneStack.height * 0.2;
  }
  return risk;
}

function adjacentEnemies(row, col, playerId) {
  const res = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (!inBounds(r, c)) continue;
      const cell = cellAt(r, c);
      if (cell && cell.playerId !== playerId) res.push(cell);
    }
  }
  const zoneStack = state.flagZone.stack;
  if (zoneStack && zoneStack.playerId !== playerId && isAdjacentToZone(row, col)) {
    res.push(zoneStack);
  }
  return res;
}

function coord(row, col) {
  return `${String.fromCharCode(65 + col)}${BOARD_SIZE - row}`;
}

function friendlyStacks(playerId) {
  const res = [];
  const zoneStack = state.flagZone.stack;
  if (zoneStack && zoneStack.playerId === playerId) {
    res.push({ row: ZONE_ANCHOR.row, col: ZONE_ANCHOR.col, stack: zoneStack, inZone: true });
  }
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = cellAt(r, c);
      if (cell && cell.playerId === playerId) res.push({ row: r, col: c, stack: cell, inZone: false });
    }
  }
  return res;
}

function manhattan(r1, c1, r2, c2) {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

function chebyshev(r1, c1, r2, c2) {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
}

function distanceToZone(row, col) {
  let best = Infinity;
  for (const sq of zoneSquares()) {
    const d = chebyshev(row, col, sq.row, sq.col);
    if (d < best) best = d;
  }
  return best;
}

function distanceToObjective(loc, objective) {
  if (loc.inZone && objective.inZone) return 0;
  if (objective.inZone) {
    const row = loc.inZone ? ZONE_ANCHOR.row : loc.row;
    const col = loc.inZone ? ZONE_ANCHOR.col : loc.col;
    return distanceToZone(row, col);
  }
  if (loc.inZone) {
    return distanceToZone(objective.row, objective.col);
  }
  return chebyshev(loc.row, loc.col, objective.row, objective.col);
}

function gameConfigFromControls() {
  const localOpponents = Math.max(0, Math.min(3, Number(localPlayersSelect ? localPlayersSelect.value : 0) || 0));
  const localPlayers = 1 + localOpponents;
  const maxBots = Math.max(0, 4 - localPlayers);
  const botCount = Math.max(0, Math.min(maxBots, Number(botCountSelect ? botCountSelect.value : 0) || 0));
  const aiDifficulty = String(aiDifficultySelect ? aiDifficultySelect.value : "normal").toLowerCase();
  return { localOpponents, botCount, aiDifficulty };
}

function syncLobbyControls() {
  const localOpponents = Math.max(0, Math.min(3, Number(localPlayersSelect ? localPlayersSelect.value : 0) || 0));
  const localPlayers = 1 + localOpponents;
  const maxBots = Math.max(0, 4 - localPlayers);
  const selectedBots = Math.max(0, Math.min(maxBots, Number(botCountSelect ? botCountSelect.value : 0) || 0));

  if (botCountSelect) {
    const currentOptions = Array.from(botCountSelect.options).map((opt) => Number(opt.value));
    const expected = Array.from({ length: maxBots + 1 }, (_, i) => i);
    const matches =
      currentOptions.length === expected.length &&
      currentOptions.every((value, idx) => value === expected[idx]);
    if (!matches) {
      botCountSelect.innerHTML = "";
      expected.forEach((value) => {
        const opt = document.createElement("option");
        opt.value = String(value);
        opt.textContent = String(value);
        botCountSelect.appendChild(opt);
      });
    }
    botCountSelect.value = String(selectedBots);
  }

  if (aiSpeedBlock) {
    aiSpeedBlock.classList.toggle("is-hidden", selectedBots === 0);
  }
  if (aiDifficultyBlock) {
    aiDifficultyBlock.classList.toggle("is-hidden", selectedBots === 0);
  }
  if (starterModeSelect) starterModeSelect.disabled = false;
}

function resetGame() {
  if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
  syncLobbyControls();
  const config = gameConfigFromControls();
  const requestedSetupMode = starterModeSelect ? starterModeSelect.value : DEFAULT_STARTER_MODE;
  const setupMode = requestedSetupMode === "hidden" ? "hidden" : "turn";
  state = initialState(config, setupMode);
  if (setupMode === "hidden" && state.setupMode !== "hidden") {
    state.lastMessage =
      "Hidden lock-in currently supports single-local-player games. Switched to turn-based starters.";
  } else if (state.setupMode === "hidden") {
    state.lastMessage =
      "Hidden setup: pick a shape below, place 6 starters on your home row, then press Lock Starters. Bots place after you lock.";
  }
  if (state.setupMode === "turn") {
    initAiStarterPlans(true);
  }
  const playerSummary = state.players
    .map((p) => `${p.name}(${p.side}${p.isAI ? ",AI" : ""})`)
    .join(", ");
  logDev(
    `Reset game: mode=${state.gameMode} localOpponents=${config.localOpponents} bots=${config.botCount} difficulty=${state.aiDifficulty} players=${state.players.length} [${playerSummary}] setupMode=${state.setupMode}`
  );
  trackGameStart();
  render();
  maybeRunAI();
}

// ---------- Starting setup ----------
function starterListFromCounts(counts) {
  const list = [];
  SHAPES.forEach((shape) => {
    const n = counts[shape] || 0;
    for (let i = 0; i < n; i++) list.push(shape);
  });
  return list;
}

function aiStarterPattern(profile) {
  if (!profile) return "random";
  if (profile.name === "Hunter") return "stack";
  if (profile.name === "Builder") return "spread";
  if (profile.name === "Opportunist") return "center";
  if (profile.name === "Guardian") return "spread";
  return "random";
}

function pickStarterCountsWithWeights(weights, stockPerShape, starterCount) {
  const counts = { circle: 0, triangle: 0, square: 0 };
  const available = {
    circle: stockPerShape,
    triangle: stockPerShape,
    square: stockPerShape,
  };
  if (starterCount >= 3) {
    SHAPES.forEach((shape) => {
      counts[shape] += 1;
      available[shape] -= 1;
    });
  }
  for (let i = 0; i < starterCount - (starterCount >= 3 ? 3 : 0); i++) {
    const shape = weightedPick(weights, available);
    counts[shape] += 1;
    available[shape] -= 1;
  }
  return counts;
}

function pickStarterCounts(player, stockPerShape, starterCount, weightsOverride) {
  const weights =
    weightsOverride ||
    (activeAiProfile(player) && activeAiProfile(player).starterWeights) || {
      circle: 1,
      triangle: 1,
      square: 1,
    };
  return pickStarterCountsWithWeights(weights, stockPerShape, starterCount);
}

function weightedPick(weights, available) {
  const options = SHAPES.filter((shape) => available[shape] > 0);
  let total = 0;
  options.forEach((shape) => {
    total += weights[shape] || 1;
  });
  let r = Math.random() * total;
  for (const shape of options) {
    r -= weights[shape] || 1;
    if (r <= 0) return shape;
  }
  return options[0];
}

function buildStarterStrategyPool() {
  const pool = [
    { name: "persona" },
    { name: "balanced" },
    { name: "counter" },
    { name: "skewed" },
  ];
  shuffle(pool);
  return pool;
}

function dominantShape(counts) {
  if (!counts) return null;
  let max = -1;
  let options = [];
  SHAPES.forEach((shape) => {
    const value = counts[shape] || 0;
    if (value > max) {
      max = value;
      options = [shape];
    } else if (value === max) {
      options.push(shape);
    }
  });
  if (max <= 0 || options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)];
}

function counterShapeOf(shape) {
  if (shape === "circle") return "square";
  if (shape === "triangle") return "circle";
  if (shape === "square") return "triangle";
  return "circle";
}

function counterWeights(counts) {
  const weights = { circle: 1, triangle: 1, square: 1 };
  const dominant = dominantShape(counts);
  const target = dominant ? counterShapeOf(dominant) : SHAPES[Math.floor(Math.random() * SHAPES.length)];
  weights[target] = 1.6;
  return weights;
}

function favoredShapeFromWeights(weights) {
  let max = -Infinity;
  let options = [];
  SHAPES.forEach((shape) => {
    const value = weights[shape] || 0;
    if (value > max) {
      max = value;
      options = [shape];
    } else if (value === max) {
      options.push(shape);
    }
  });
  if (options.length === 0) return SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return options[Math.floor(Math.random() * options.length)];
}

function starterStrategyDetails(player, strategyName, humanCounts) {
  const profile = activeAiProfile(player);
  if (useCompetitiveProfile()) {
    return {
      name: "competitive",
      weights: profile.starterWeights || { circle: 1, triangle: 1, square: 1 },
      pattern: "center",
    };
  }
  if (strategyName === "balanced") {
    return { name: "balanced", weights: { circle: 1, triangle: 1, square: 1 }, pattern: "spread" };
  }
  if (strategyName === "counter") {
    return { name: "counter", weights: counterWeights(humanCounts), pattern: "center" };
  }
  if (strategyName === "skewed") {
    const base = (profile && profile.starterWeights) || { circle: 1, triangle: 1, square: 1 };
    const fav = favoredShapeFromWeights(base);
    const weights = { circle: 0.8, triangle: 0.8, square: 0.8 };
    weights[fav] = 1.7;
    return { name: "skewed", weights, pattern: "stack" };
  }
  const fallbackWeights = (profile && profile.starterWeights) || { circle: 1, triangle: 1, square: 1 };
  return { name: "persona", weights: fallbackWeights, pattern: aiStarterPattern(profile) };
}

function buildAiStarterPlan(player, pool, humanCounts) {
  const entry = pool && pool.length > 0 ? pool.shift() : { name: "persona" };
  const strategy = starterStrategyDetails(player, entry.name, humanCounts);
  const counts = pickStarterCounts(player, STOCK_PER_SHAPE, STARTER_COUNT, strategy.weights);
  const list = starterListFromCounts(counts);
  if (strategy.pattern === "random") shuffle(list);
  return {
    strategy,
    counts,
    remaining: { ...counts },
    list,
    pattern: strategy.pattern,
    anchor: {},
  };
}

function chooseStarterShapeFromRemaining(remaining, weights) {
  const options = SHAPES.filter((shape) => (remaining[shape] || 0) > 0);
  if (options.length === 0) return null;
  let total = 0;
  options.forEach((shape) => {
    total += weights[shape] || 1;
  });
  let r = Math.random() * total;
  for (const shape of options) {
    r -= weights[shape] || 1;
    if (r <= 0) return shape;
  }
  return options[0];
}

function initAiStarterPlans(logPlans) {
  const pool = buildStarterStrategyPool();
  state.players.forEach((p) => {
    if (!p.isAI) return;
    p.starterPlan = buildAiStarterPlan(p, pool, state.starterCounts);
    if (logPlans) {
      const plan = p.starterPlan;
      logDev(
        `${p.name} starter plan: C${plan.counts.circle} T${plan.counts.triangle} S${plan.counts.square} (${plan.pattern}, ${plan.strategy.name}).`
      );
    }
  });
}

function starterHomeSquaresFor(side) {
  return homeSquaresFor(side);
}

function centerDistance(square, side) {
  if (side === "south" || side === "north") {
    return Math.abs(square.col - (BOARD_SIZE / 2 - 0.5));
  }
  return Math.abs(square.row - (BOARD_SIZE / 2 - 0.5));
}

function findLegalSquare(player, shape, orderedSquares, preferEmpty) {
  let candidates = orderedSquares.filter((sq) => {
    const cell = cellAt(sq.row, sq.col);
    return !cell || (cell.playerId === player.id && cell.shape === shape);
  });
  if (preferEmpty) {
    const empties = candidates.filter((sq) => !cellAt(sq.row, sq.col));
    if (empties.length > 0) candidates = empties;
  }
  if (candidates.length === 0) return null;
  if (preferEmpty || orderedSquares.length > 0) {
    return candidates[0];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function placeStarters(player, counts, placementPattern) {
  const pattern = (placementPattern || "random").toLowerCase();
  const list = starterListFromCounts(counts);
  const home = starterHomeSquaresFor(player.side);
  const ordered = home.slice();
  if (pattern === "center") {
    ordered.sort((a, b) => centerDistance(a, player.side) - centerDistance(b, player.side));
  } else if (pattern === "random") {
    shuffle(ordered);
  }
  if (pattern === "random") shuffle(list);
  const anchor = {};
  list.forEach((shape) => {
    let pick = null;
    if (pattern === "stack") {
      if (anchor[shape]) {
        pick = anchor[shape];
      } else {
        pick = findLegalSquare(player, shape, ordered, false);
        anchor[shape] = pick;
      }
    } else {
      pick = findLegalSquare(player, shape, ordered, true);
    }
    if (!pick) {
      pick = findLegalSquare(player, shape, ordered, false);
    }
    if (pick) {
      placeStarterAt(player, shape, pick.row, pick.col, true);
    }
  });
}

function ensureAiStarterPlan(player) {
  if (player.starterPlan) return player.starterPlan;
  const pool = buildStarterStrategyPool();
  player.starterPlan = buildAiStarterPlan(player, pool, state.starterCounts);
  return player.starterPlan;
}

function placeSingleStarterByPattern(player, shape, pattern, anchor) {
  const mode = (pattern || "random").toLowerCase();
  const home = starterHomeSquaresFor(player.side);
  const ordered = home.slice();
  if (mode === "center") {
    ordered.sort((a, b) => centerDistance(a, player.side) - centerDistance(b, player.side));
  } else if (mode === "random") {
    shuffle(ordered);
  }
  let pick = null;
  if (mode === "stack") {
    if (anchor && anchor[shape]) {
      pick = anchor[shape];
    } else {
      pick = findLegalSquare(player, shape, ordered, false);
      if (anchor) anchor[shape] = pick;
    }
  } else {
    pick = findLegalSquare(player, shape, ordered, true);
  }
  if (!pick) {
    pick = findLegalSquare(player, shape, ordered, false);
  }
  if (!pick) return false;
  return placeStarterAt(player, shape, pick.row, pick.col, false);
}

function allStartersPlaced() {
  return state.players.every((p) => (state.starterPlacedBy[p.id] || 0) >= STARTER_COUNT);
}

function advanceSetupTurn() {
  if (state.gameOver) return;
  state.selected = null;
  state.placingShape = null;
  if (allStartersPlaced()) {
    state.phase = "play";
    state.lastMessage = "All starters placed. Game begins!";
    render();
    maybeRunAI();
    return;
  }
  let next = (state.current + 1) % state.players.length;
  let guard = 0;
  while ((state.starterPlacedBy[state.players[next].id] || 0) >= STARTER_COUNT) {
    next = (next + 1) % state.players.length;
    guard += 1;
    if (guard > state.players.length) break;
  }
  state.current = next;
  render();
  maybeRunAI();
}

function setupEvents() {
  boardEl.addEventListener("click", handleCellClick);
  placeBtns.forEach((btn) =>
    btn.addEventListener("click", () => selectPlacement(btn.dataset.shape))
  );
  if (lockStartersBtn) {
    lockStartersBtn.addEventListener("click", lockStarters);
  }
  cancelActionBtn.addEventListener("click", cancelAction);
  newGameBtn.addEventListener("click", resetGame);
  if (winActionBtn) {
    winActionBtn.addEventListener("click", resetGame);
  }
  if (localPlayersSelect) {
    localPlayersSelect.addEventListener("change", resetGame);
  }
  if (botCountSelect) {
    botCountSelect.addEventListener("change", resetGame);
  }
  if (aiDifficultySelect) {
    aiDifficultySelect.addEventListener("change", resetGame);
  }
  if (starterModeSelect) {
    starterModeSelect.addEventListener("change", resetGame);
  }
  if (feedbackBtn) {
    feedbackBtn.addEventListener("click", sendAnonymousFeedback);
  }
}

function setupPlaytestGate() {
  if (!playtestGateEl || !playtestAgreeBtn) return;
  try {
    if (window.localStorage.getItem(PLAYTEST_GATE_ACK_KEY) === "1") {
      playtestGateEl.classList.add("is-hidden");
      document.body.classList.remove("gate-open");
      return;
    }
  } catch {
    // If storage is unavailable, keep default one-time-per-page behavior.
  }
  document.body.classList.add("gate-open");
  playtestAgreeBtn.addEventListener("click", () => {
    try {
      window.localStorage.setItem(PLAYTEST_GATE_ACK_KEY, "1");
    } catch {
      // Ignore storage errors.
    }
    playtestGateEl.classList.add("is-hidden");
    document.body.classList.remove("gate-open");
    if (newGameBtn) newGameBtn.focus();
  }, { once: true });
}

// Boot
setupPlaytestGate();
setupEvents();
resetGame();
initFeedbackQueue();
initTelemetryQueue();

// ---------- Dev log (file-based) ----------
function logDev(message) {
  fetch("/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry: message }),
  }).catch(() => {});
}

function makeClientFeedbackId() {
  return `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function loadFeedbackQueue() {
  try {
    const raw = window.localStorage.getItem(FEEDBACK_QUEUE_KEY_LOCAL);
    if (!raw) return feedbackQueueMemory.slice();
    const parsed = JSON.parse(raw);
    const queue = Array.isArray(parsed) ? parsed : [];
    feedbackQueueMemory = queue.slice();
    return queue;
  } catch {
    return feedbackQueueMemory.slice();
  }
}

function saveFeedbackQueue(queue) {
  feedbackQueueMemory = Array.isArray(queue) ? queue.slice() : [];
  try {
    window.localStorage.setItem(FEEDBACK_QUEUE_KEY_LOCAL, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

function enqueueFeedback(payload) {
  const queue = loadFeedbackQueue();
  queue.push({
    id: payload.clientFeedbackId,
    payload,
    queuedAt: new Date().toISOString(),
    attempts: 0,
    lastError: "",
    lastTriedAt: null,
  });
  while (queue.length > FEEDBACK_QUEUE_MAX) queue.shift();
  const persisted = saveFeedbackQueue(queue);
  return { length: queue.length, persisted };
}

function isPermanentFeedbackError(status) {
  return status >= 400 && status < 500 && status !== 429;
}

function getFeedbackIngestUrl() {
  return (typeof window !== "undefined" && window.BASIL_FEEDBACK_INGEST_URL) || "";
}

async function postFeedbackPayload(payload) {
  const url = getFeedbackIngestUrl();
  if (!url) throw new Error("Feedback endpoint not configured");
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(data.error || "Feedback rejected");
    err.status = resp.status;
    err.retryAfterSec = Number(data.retryAfterSec || 0);
    throw err;
  }
  return data || {};
}

async function drainFeedbackQueue(maxItems = 10, prioritizeId = null) {
  if (feedbackQueueBusy) return { sent: 0, dropped: 0, remaining: loadFeedbackQueue().length, receipt: null };
  feedbackQueueBusy = true;
  let sent = 0;
  let dropped = 0;
  let receipt = null;
  let retryAfterSec = 0;
  try {
    let queue = loadFeedbackQueue();
    if (prioritizeId) {
      const idx = queue.findIndex((item) => item && item.id === prioritizeId);
      if (idx > 0) {
        const [item] = queue.splice(idx, 1);
        queue.unshift(item);
      }
    }
    while (queue.length > 0 && sent < maxItems) {
      const item = queue[0];
      if (!item || !item.payload || !item.payload.clientFeedbackId) {
        queue.shift();
        dropped += 1;
        continue;
      }
      try {
        const ack = await postFeedbackPayload(item.payload);
        queue.shift();
        sent += 1;
        if (prioritizeId && item.id === prioritizeId) {
          receipt = ack;
        }
      } catch (err) {
        item.attempts = Number(item.attempts || 0) + 1;
        item.lastError = String(err.message || "unknown error").slice(0, 200);
        item.lastTriedAt = new Date().toISOString();
        queue[0] = item;
        if (isPermanentFeedbackError(Number(err.status || 0))) {
          queue.shift();
          dropped += 1;
          continue;
        }
        retryAfterSec = Math.max(0, Number(err.retryAfterSec || 0));
        break;
      }
    }
    const persisted = saveFeedbackQueue(queue);
    if (queue.length > 0) {
      const delay = retryAfterSec > 0 ? retryAfterSec * 1000 : FEEDBACK_RETRY_MS;
      scheduleFeedbackRetry(delay);
    }
    return { sent, dropped, remaining: queue.length, receipt, persisted };
  } finally {
    feedbackQueueBusy = false;
  }
}

function scheduleFeedbackRetry(delayMs = FEEDBACK_RETRY_MS) {
  if (feedbackRetryTimer) return;
  feedbackRetryTimer = window.setTimeout(async () => {
    feedbackRetryTimer = null;
    await drainFeedbackQueue(25);
  }, Math.max(1000, delayMs));
}

function initFeedbackQueue() {
  window.addEventListener("online", () => {
    drainFeedbackQueue(25);
  });
  drainFeedbackQueue(10);
}

async function sendAnonymousFeedback() {
  const raw = window.prompt("Anonymous feedback (max 500 chars):");
  if (raw === null) return;
  const feedback = String(raw || "").trim().slice(0, 500);
  if (!feedback) {
    if (state) {
      state.lastMessage = "Feedback cancelled.";
      render();
    }
    return;
  }
  const payload = {
    clientFeedbackId: makeClientFeedbackId(),
    feedback,
    gameId: "elam",
    page: "local",
    source: "ui",
    context: buildLocalFeedbackContext(),
  };
  const queued = enqueueFeedback(payload);
  if (state) {
    state.lastMessage = queued.persisted
      ? `Feedback queued (${queued.length} pending). Sending...`
      : "Feedback queued in-memory (browser storage blocked). Keep this tab open while it sends.";
    render();
  }
  const result = await drainFeedbackQueue(1, payload.clientFeedbackId);
  if (state) {
    if (result.receipt && result.receipt.receiptId) {
      state.lastMessage = `Thanks. Anonymous feedback logged. Receipt: ${result.receipt.receiptId}`;
    } else if (result.remaining > 0) {
      state.lastMessage = `Feedback saved locally (${result.remaining} pending). Will retry automatically.`;
    } else {
      state.lastMessage = "Feedback saved locally and queued for retry.";
    }
    render();
  }
}

function buildLocalFeedbackContext() {
  if (!state) return { mode: "local", status: "no-state" };
  const current = currentPlayer();
  const stackSummary = {};
  state.players.forEach((p) => {
    stackSummary[p.id] = { boardStacks: 0, boardHeight: 0, zoneStack: 0 };
  });
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = cellAt(r, c);
      if (!cell) continue;
      if (!stackSummary[cell.playerId]) continue;
      stackSummary[cell.playerId].boardStacks += 1;
      stackSummary[cell.playerId].boardHeight += Number(cell.height || 0);
    }
  }
  if (state.flagZone.stack && stackSummary[state.flagZone.stack.playerId]) {
    stackSummary[state.flagZone.stack.playerId].zoneStack = Number(state.flagZone.stack.height || 0);
  }
  const supplies = {};
  state.players.forEach((p) => {
    supplies[p.id] = { ...state.supplies[p.id] };
  });
  return {
    mode: "local",
    capturedAt: new Date().toISOString(),
    gameMode: state.gameMode,
    phase: state.phase,
    setupMode: state.setupMode,
    gameOver: !!state.gameOver,
    winner: state.winner || null,
    aiDifficulty: state.aiDifficulty || "normal",
    turn: current
      ? {
          index: state.current,
          playerId: current.id,
          playerName: current.name,
          side: current.side,
          isAI: !!current.isAI,
        }
      : null,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      side: p.side,
      isAI: !!p.isAI,
    })),
    flag: { ...state.flag },
    flagZone: {
      holdTurns: state.flagZone.holdTurns,
      stack: state.flagZone.stack
        ? {
            playerId: state.flagZone.stack.playerId,
            shape: state.flagZone.stack.shape,
            height: state.flagZone.stack.height,
            hasFlag: !!state.flagZone.stack.hasFlag,
          }
        : null,
    },
    selected: state.selected || null,
    placingShape: state.placingShape || null,
    starterPlacedBy: { ...state.starterPlacedBy },
    stackSummary,
    supplies,
    lastMessage: state.lastMessage || "",
  };
}

// ---------- Telemetry ----------
const TELEMETRY_QUEUE_KEY = "elam_telemetry_queue_local_v1";
const TELEMETRY_QUEUE_MAX = 100;
const TELEMETRY_FLUSH_INTERVAL_MS = 30000;
let telemetryFlushTimer = null;
let gameStartedAt = null;
let gameActionCount = 0;

function getEventsIngestUrl() {
  return (typeof window !== "undefined" && window.BASIL_EVENTS_INGEST_URL) || "";
}

function loadTelemetryQueue() {
  try {
    const raw = localStorage.getItem(TELEMETRY_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTelemetryQueue(queue) {
  try {
    localStorage.setItem(TELEMETRY_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch { return false; }
}

function enqueueTelemetryEvent(name, payload) {
  const event = {
    id: crypto.randomUUID ? crypto.randomUUID() : `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    name,
    payload,
    timestamp: Date.now(),
  };
  const queue = loadTelemetryQueue();
  queue.push(event);
  while (queue.length > TELEMETRY_QUEUE_MAX) queue.shift();
  saveTelemetryQueue(queue);
  return event;
}

async function flushTelemetryQueue() {
  const url = getEventsIngestUrl();
  if (!url) return;
  const queue = loadTelemetryQueue();
  if (queue.length === 0) return;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: queue }),
    });
    if (resp.ok) {
      saveTelemetryQueue([]);
    }
  } catch { /* will retry next flush */ }
}

function initTelemetryQueue() {
  if (telemetryFlushTimer) return;
  telemetryFlushTimer = setInterval(() => flushTelemetryQueue(), TELEMETRY_FLUSH_INTERVAL_MS);
  window.addEventListener("beforeunload", () => flushTelemetryQueue());
  window.addEventListener("online", () => flushTelemetryQueue());
  flushTelemetryQueue();
}

function trackGameStart() {
  if (!state) return;
  gameStartedAt = Date.now();
  gameActionCount = 0;
  const humanCount = state.players.filter((p) => !p.isAI).length;
  const botCount = state.players.filter((p) => p.isAI).length;
  enqueueTelemetryEvent("game_start", {
    gameId: "elam",
    mode: "local",
    setupMode: state.setupMode,
    playerCount: state.players.length,
    humanCount,
    botCount,
    aiDifficulty: state.aiDifficulty || "normal",
    players: state.players.map((p) => ({
      side: p.side,
      isAI: !!p.isAI,
    })),
  });
}

function trackGameEnd() {
  if (!state || !state.gameOver) return;
  const durationMs = gameStartedAt ? Date.now() - gameStartedAt : 0;
  const winnerPlayer = state.players.find((p) => state.winner && state.winner.includes(p.name));
  enqueueTelemetryEvent("game_end", {
    gameId: "elam",
    mode: "local",
    durationMs,
    turnCount: state.current || 0,
    actionCount: gameActionCount,
    winner: winnerPlayer
      ? { side: winnerPlayer.side, isAI: !!winnerPlayer.isAI }
      : null,
    playerCount: state.players.length,
    humanCount: state.players.filter((p) => !p.isAI).length,
    botCount: state.players.filter((p) => p.isAI).length,
    aiDifficulty: state.aiDifficulty || "normal",
  });
  flushTelemetryQueue();
}

function assignAiProfiles(players) {
  const shuffled = [...AI_PROFILES];
  shuffle(shuffled);
  let idx = 0;
  players.forEach((p) => {
    if (!p.isAI) return;
    p.aiProfile = shuffled[idx % shuffled.length];
    idx += 1;
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
