/**
 * Elam Local AI — Pure, testable module.
 *
 * All functions receive game state through a `ctx` context object
 * instead of reading globals.  Random numbers come from an injected
 * `rng` function (default: Math.random) so tests can be deterministic.
 *
 * UMD wrapper: works as <script> in browser (sets window.ElamLocalAI)
 * and as require() in Node.js.
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ElamLocalAI = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ── Board constants (mirror engine.js) ─────────────────────
  var BOARD_SIZE   = 8;
  var ZONE_START   = 3;
  var ZONE_END     = 4;
  var ZONE_ANCHOR  = { row: 3, col: 3 };
  var SHAPES       = ['circle', 'triangle', 'square'];

  // circle > triangle > square > circle
  function shapeBeats(a, b) {
    return (
      (a === 'circle' && b === 'triangle') ||
      (a === 'triangle' && b === 'square') ||
      (a === 'square' && b === 'circle')
    );
  }

  // ── AI Profiles ────────────────────────────────────────────
  var AI_PROFILES = [
    {
      name: 'Hunter',
      description: 'Aggressive chaser. Prioritizes captures and flag carriers.',
      starterWeights: { circle: 1.3, triangle: 1.2, square: 0.8 },
      weights: {
        advance: 1.6, capture: 2.6, flag: 2.2, home: 2.0,
        build: 0.4, support: 0.6, risk: 1.2, zone: 1.1, intercept: 2.4,
      },
      randomness: 0.8,
    },
    {
      name: 'Builder',
      description: 'Stacks up and advances steadily.',
      starterWeights: { circle: 1.0, triangle: 1.0, square: 1.0 },
      weights: {
        advance: 1.4, capture: 1.4, flag: 1.8, home: 1.6,
        build: 1.8, support: 0.8, risk: 1.0, zone: 1.0, intercept: 1.1,
      },
      randomness: 0.6,
    },
    {
      name: 'Opportunist',
      description: 'Opens with placements, then looks for tactical swings.',
      starterWeights: { circle: 0.9, triangle: 1.3, square: 0.9 },
      weights: {
        advance: 1.2, capture: 2.0, flag: 2.4, home: 1.6,
        build: 1.0, support: 0.6, risk: 0.9, zone: 1.4, intercept: 1.6,
      },
      randomness: 1.1,
    },
    {
      name: 'Guardian',
      description: 'Defensive escort for friendly flag carriers.',
      starterWeights: { circle: 0.9, triangle: 0.9, square: 1.3 },
      weights: {
        advance: 1.0, capture: 1.4, flag: 1.6, home: 1.8,
        build: 0.8, support: 1.8, risk: 1.6, zone: 1.2, intercept: 2.1,
      },
      randomness: 0.5,
    },
  ];

  var COMPETITIVE_AI_PROFILE = {
    name: 'Competitive',
    description: 'Strong strategy profile used for hard bots.',
    starterWeights: { circle: 1.1, triangle: 1.1, square: 1.1 },
    weights: {
      advance: 1.9, capture: 3.0, flag: 2.8, home: 2.9,
      build: 0.7, support: 1.1, risk: 1.8, zone: 1.5, intercept: 3.1,
    },
    randomness: 0.0,
  };

  var COMPETITIVE_MAX_PROFILE = {
    name: 'CompetitiveMax',
    description: 'Maximum strength — cautious, interception-focused, risk-averse.',
    starterWeights: { circle: 1.2, triangle: 1.2, square: 1.0 },
    weights: {
      advance: 1.3, capture: 3.2, flag: 3.0, home: 3.2,
      build: 0.3, support: 0.5, risk: 3.0, zone: 1.6, intercept: 4.0,
    },
    randomness: 0.0,
  };

  var AI_DIFFICULTY_SETTINGS = {
    easy:        { topN: 7,  scoreJitter: 3.4, blunderChance: 0.34, blunderTopN: 12 },
    normal:      { topN: 3,  scoreJitter: 0.9, blunderChance: 0.07, blunderTopN: 6  },
    hard:        { topN: 1,  scoreJitter: 0.0, blunderChance: 0.0,  blunderTopN: 1  },
    competitive: { topN: 1,  scoreJitter: 0.0, blunderChance: 0.0,  blunderTopN: 1  },
  };

  var AI_DIFFICULTY_WEIGHT_MODS = {
    easy:        { objective: 0.82, capture: 0.82, home: 0.82, intercept: 0.75, risk: 0.58, zone: 0.85, build: 0.9  },
    normal:      { objective: 1.0,  capture: 1.0,  home: 1.0,  intercept: 1.2,  risk: 1.4,  zone: 1.0,  build: 1.0  },
    hard:        { objective: 1.24, capture: 1.18, home: 1.3,  intercept: 1.5,  risk: 1.35, zone: 1.2,  build: 1.05 },
    competitive: { objective: 1.45, capture: 1.4,  home: 1.55, intercept: 2.0,  risk: 2.8,  zone: 1.35, build: 0.9  },
  };

  // ── 2-ply lookahead configuration ───────────────────────────
  var TWO_PLY_CONFIG = {
    hard: {
      immediateLossPenalty: -50,  // avoid immediate losses but play aggressive
      carrierThreatPenalty: -5,   // tolerate moderate carrier risk
      generalCapturePenalty: 0,   // skip general stack safety scan
      safetyMinHeight: 2,
      counterMoveWeight: 0,      // skip opponent counter-move check
      escortBonus: 0,            // no escort evaluation
      routeBlockBonus: 0,        // no route-blocking evaluation
    },
    competitive: {
      immediateLossPenalty: -100, // absolutely avoid immediate losses
      carrierThreatPenalty: -15,  // strongly protect the carrier
      generalCapturePenalty: -5,  // penalise exposing any stack
      safetyMinHeight: 1,        // check ALL stacks, not just merged
      counterMoveWeight: -3,     // penalise moves that give opponent strong captures
      escortBonus: 1.5,          // reward friendly pieces near carrier post-move
      routeBlockBonus: 2.0,      // reward blocking enemy carrier's path to winning edge
    },
  };

  // ── Pure utilities ─────────────────────────────────────────

  function normalizeDifficulty(d) {
    return String(d || 'normal').toLowerCase();
  }

  function getDifficultySettings(difficulty) {
    var key = normalizeDifficulty(difficulty);
    return AI_DIFFICULTY_SETTINGS[key] || AI_DIFFICULTY_SETTINGS.normal;
  }

  function getDifficultyWeightMods(difficulty) {
    var key = normalizeDifficulty(difficulty);
    return AI_DIFFICULTY_WEIGHT_MODS[key] || AI_DIFFICULTY_WEIGHT_MODS.normal;
  }

  function activeAiProfile(player, difficulty) {
    var key = normalizeDifficulty(difficulty);
    if (key === 'competitive') return COMPETITIVE_MAX_PROFILE;
    if (key === 'hard') return COMPETITIVE_AI_PROFILE;
    return player.aiProfile || AI_PROFILES[0];
  }

  function chebyshev(r1, c1, r2, c2) {
    return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
  }

  function isZoneSquare(row, col) {
    return row >= ZONE_START && row <= ZONE_END && col >= ZONE_START && col <= ZONE_END;
  }

  function zoneSquares() {
    return [
      { row: ZONE_START, col: ZONE_START },
      { row: ZONE_START, col: ZONE_END },
      { row: ZONE_END,   col: ZONE_START },
      { row: ZONE_END,   col: ZONE_END },
    ];
  }

  function isAdjacentToZone(row, col) {
    var sqs = zoneSquares();
    for (var i = 0; i < sqs.length; i++) {
      if (Math.max(Math.abs(row - sqs[i].row), Math.abs(col - sqs[i].col)) === 1) return true;
    }
    return false;
  }

  function inBounds(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  function distanceToZone(row, col) {
    var best = Infinity;
    var sqs = zoneSquares();
    for (var i = 0; i < sqs.length; i++) {
      var d = chebyshev(row, col, sqs[i].row, sqs[i].col);
      if (d < best) best = d;
    }
    return best;
  }

  function distanceToObjective(loc, objective) {
    if (loc.inZone && objective.inZone) return 0;
    if (objective.inZone) {
      var row = loc.inZone ? ZONE_ANCHOR.row : loc.row;
      var col = loc.inZone ? ZONE_ANCHOR.col : loc.col;
      return distanceToZone(row, col);
    }
    if (loc.inZone) {
      return distanceToZone(objective.row, objective.col);
    }
    return chebyshev(loc.row, loc.col, objective.row, objective.col);
  }

  function distanceToHomeEdge(side, row, col) {
    if (side === 'south') return BOARD_SIZE - 1 - row;
    if (side === 'north') return row;
    if (side === 'west')  return col;
    if (side === 'east')  return BOARD_SIZE - 1 - col;
    return 0;
  }

  function homeTargetFor(side) {
    if (side === 'south') return { row: BOARD_SIZE - 1, col: 3 };
    if (side === 'north') return { row: 0, col: 3 };
    if (side === 'west')  return { row: 3, col: 0 };
    if (side === 'east')  return { row: 3, col: BOARD_SIZE - 1 };
    return { row: BOARD_SIZE - 1, col: 3 };
  }

  function sameLoc(a, b) {
    if (a.inZone && b.inZone) return true;
    if (a.inZone || b.inZone) return false;
    return a.row === b.row && a.col === b.col;
  }

  function coord(row, col) {
    return String.fromCharCode(65 + col) + String(BOARD_SIZE - row);
  }

  // ── State-reading helpers (via ctx) ────────────────────────

  function friendlyStacks(playerId, ctx) {
    var res = [];
    var zoneStack = ctx.flagZone.stack;
    if (zoneStack && zoneStack.playerId === playerId) {
      res.push({ row: ZONE_ANCHOR.row, col: ZONE_ANCHOR.col, stack: zoneStack, inZone: true });
    }
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var cell = ctx.cellAt(r, c);
        if (cell && cell.playerId === playerId) res.push({ row: r, col: c, stack: cell, inZone: false });
      }
    }
    return res;
  }

  function adjacentEnemies(row, col, playerId, ctx) {
    var res = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var r = row + dr;
        var c = col + dc;
        if (!inBounds(r, c)) continue;
        var cell = ctx.cellAt(r, c);
        if (cell && cell.playerId !== playerId) res.push(cell);
      }
    }
    var zoneStack = ctx.flagZone.stack;
    if (zoneStack && zoneStack.playerId !== playerId && isAdjacentToZone(row, col)) {
      res.push(zoneStack);
    }
    return res;
  }

  function findCarrier(playerId, ctx) {
    var zoneStack = ctx.flagZone.stack;
    if (zoneStack && zoneStack.playerId === playerId && zoneStack.hasFlag) {
      return { row: ZONE_ANCHOR.row, col: ZONE_ANCHOR.col, stack: zoneStack, inZone: true };
    }
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var cell = ctx.cellAt(r, c);
        if (cell && cell.playerId === playerId && cell.hasFlag) {
          return { row: r, col: c, stack: cell, inZone: false };
        }
      }
    }
    return null;
  }

  function getEnemyCarrier(playerId, ctx) {
    if (!ctx.flag.carriedBy || ctx.flag.carriedBy === playerId) return null;
    var carrier = findCarrier(ctx.flag.carriedBy, ctx);
    if (!carrier) return null;
    var carrierPlayer = ctx.playerById(ctx.flag.carriedBy);
    return { row: carrier.row, col: carrier.col, stack: carrier.stack, inZone: carrier.inZone, player: carrierPlayer };
  }

  function canCaptureTargetFrom(stack, fromLoc, targetLoc, targetStack, ctx) {
    if (fromLoc.inZone) {
      if (targetLoc.inZone) return false;
      var evalMove = ctx.validMoveFromZone(stack, targetLoc.row, targetLoc.col);
      return evalMove.ok && evalMove.type === 'capture';
    }
    if (targetLoc.inZone) {
      var evalMove2 = ctx.validMoveToZone(stack, fromLoc.row, fromLoc.col);
      return evalMove2.ok && evalMove2.type === 'capture';
    }
    var evalMove3 = ctx.validMove(stack, fromLoc.row, fromLoc.col, targetLoc.row, targetLoc.col);
    return evalMove3.ok && evalMove3.type === 'capture';
  }

  function carrierWinningSquares(carrier, ctx) {
    if (!carrier || carrier.inZone) return [];
    var side = carrier.player ? carrier.player.side : null;
    if (!side) return [];
    var home = ctx.homeSquaresFor(ctx.oppositeSide(side));
    var wins = [];
    for (var i = 0; i < home.length; i++) {
      var sq = home[i];
      var evalMove = ctx.validMove(carrier.stack, carrier.row, carrier.col, sq.row, sq.col);
      if (evalMove.ok) wins.push(sq);
    }
    return wins;
  }

  function objectiveFor(player, ctx) {
    if (ctx.flag.carriedBy === player.id) {
      var t = homeTargetFor(ctx.oppositeSide(player.side));
      return { row: t.row, col: t.col, inZone: false };
    }
    if (ctx.flag.carriedBy && ctx.flag.carriedBy !== player.id) {
      var carrier = findCarrier(ctx.flag.carriedBy, ctx);
      if (carrier) return { row: carrier.row, col: carrier.col, inZone: carrier.inZone };
    }
    if (ctx.flag.zone) {
      return { row: ZONE_ANCHOR.row, col: ZONE_ANCHOR.col, inZone: true };
    }
    return { row: ctx.flag.row, col: ctx.flag.col, inZone: false };
  }

  // ── Candidate generation ───────────────────────────────────

  function generateMoveCandidates(player, ctx) {
    var stacks = friendlyStacks(player.id, ctx);
    var candidates = [];
    for (var si = 0; si < stacks.length; si++) {
      var s = stacks[si];
      if (s.inZone) {
        for (var r = 0; r < BOARD_SIZE; r++) {
          for (var c = 0; c < BOARD_SIZE; c++) {
            if (!isAdjacentToZone(r, c)) continue;
            var evalMove = ctx.validMoveFromZone(s.stack, r, c);
            if (!evalMove.ok) continue;
            var dest = ctx.cellAt(r, c);
            candidates.push({
              type: 'move', fromRow: s.row, fromCol: s.col,
              toRow: r, toCol: c, fromInZone: true, toInZone: false,
              stack: s.stack, evalMove: evalMove, dest: dest,
            });
          }
        }
        continue;
      }
      var h = ctx.maxMoveForStack(s.stack);
      for (var dr = -h; dr <= h; dr++) {
        for (var dc = -h; dc <= h; dc++) {
          if (dr === 0 && dc === 0) continue;
          if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) continue;
          var r2 = s.row + dr;
          var c2 = s.col + dc;
          if (!inBounds(r2, c2)) continue;
          if (isZoneSquare(r2, c2)) continue;
          var evalMove2 = ctx.validMove(s.stack, s.row, s.col, r2, c2);
          if (!evalMove2.ok) continue;
          var dest2 = ctx.cellAt(r2, c2);
          candidates.push({
            type: 'move', fromRow: s.row, fromCol: s.col,
            toRow: r2, toCol: c2, fromInZone: false, toInZone: false,
            stack: s.stack, evalMove: evalMove2, dest: dest2,
          });
        }
      }
      var zoneMove = ctx.validMoveToZone(s.stack, s.row, s.col);
      if (zoneMove.ok) {
        candidates.push({
          type: 'move', fromRow: s.row, fromCol: s.col,
          toRow: ZONE_ANCHOR.row, toCol: ZONE_ANCHOR.col,
          fromInZone: false, toInZone: true,
          stack: s.stack, evalMove: zoneMove, dest: ctx.flagZone.stack,
        });
      }
    }
    return candidates;
  }

  function generatePlacementCandidates(player, ctx) {
    var candidates = [];
    for (var si = 0; si < SHAPES.length; si++) {
      var shape = SHAPES[si];
      if (ctx.supplies[player.id][shape] <= 0) continue;
      var home = ctx.homeSquaresFor(player.side);
      for (var hi = 0; hi < home.length; hi++) {
        var sq = home[hi];
        if (ctx.canPlace(player, shape, sq.row, sq.col)) {
          candidates.push({ type: 'place', shape: shape, row: sq.row, col: sq.col });
        }
      }
    }
    return candidates;
  }

  // ── Candidate evaluation ───────────────────────────────────

  function estimateCaptureRisk(playerId, shape, row, col, destInZone, ctx) {
    var risk = 0;
    var zoneStack = ctx.flagZone.stack;
    for (var r = 0; r < BOARD_SIZE; r++) {
      for (var c = 0; c < BOARD_SIZE; c++) {
        var enemy = ctx.cellAt(r, c);
        if (!enemy || enemy.playerId === playerId) continue;
        if (!ctx.shapeBeats(enemy.shape, shape)) continue;
        if (destInZone) {
          if (ctx.canReachZoneSquare(enemy, r, c)) {
            risk += 1 + enemy.height * 0.2;
          }
          continue;
        }
        var evalMove = ctx.validMove(enemy, r, c, row, col);
        if (evalMove.ok && evalMove.type === 'capture') {
          risk += 1 + enemy.height * 0.2;
        }
      }
    }
    if (
      !destInZone &&
      zoneStack &&
      zoneStack.playerId !== playerId &&
      ctx.shapeBeats(zoneStack.shape, shape) &&
      isAdjacentToZone(row, col)
    ) {
      risk += 1 + zoneStack.height * 0.2;
    }
    return risk;
  }

  // ── 2-ply simulation helpers ──────────────────────────────

  function cloneSnapshot(ctx) {
    var board = [];
    for (var r = 0; r < BOARD_SIZE; r++) {
      board[r] = [];
      for (var c = 0; c < BOARD_SIZE; c++) {
        var cell = ctx.board[r][c];
        board[r][c] = cell
          ? { playerId: cell.playerId, shape: cell.shape, height: cell.height, hasFlag: !!cell.hasFlag }
          : null;
      }
    }
    var fzs = ctx.flagZone.stack;
    var supplies = {};
    for (var i = 0; i < ctx.players.length; i++) {
      var pid = ctx.players[i].id;
      supplies[pid] = {
        circle: ctx.supplies[pid].circle,
        triangle: ctx.supplies[pid].triangle,
        square: ctx.supplies[pid].square,
      };
    }
    return {
      board: board,
      flagZone: {
        stack: fzs
          ? { playerId: fzs.playerId, shape: fzs.shape, height: fzs.height, hasFlag: !!fzs.hasFlag }
          : null,
        holdTurns: ctx.flagZone.holdTurns || 0,
      },
      flag: {
        zone: ctx.flag.zone, row: ctx.flag.row,
        col: ctx.flag.col, carriedBy: ctx.flag.carriedBy,
      },
      supplies: supplies,
      players: ctx.players, // shared ref — not mutated
    };
  }

  function buildInternalCtx(snap) {
    function cellAt(r, c) {
      if (isZoneSquare(r, c)) return null;
      return snap.board[r][c];
    }
    function playerById(id) {
      for (var i = 0; i < snap.players.length; i++) {
        if (snap.players[i].id === id) return snap.players[i];
      }
      return null;
    }
    function maxMove(stack) {
      if (!stack) return 0;
      if (!stack.hasFlag) return stack.height;
      return Math.max(1, Math.floor(stack.height / 2));
    }
    function _dist(fr, fc, tr, tc) {
      return Math.max(Math.abs(tr - fr), Math.abs(tc - fc));
    }
    function _pathClear(stack, fr, fc, tr, tc) {
      var dr = Math.sign(tr - fr), dc = Math.sign(tc - fc);
      var r = fr + dr, c = fc + dc;
      while (r !== tr || c !== tc) {
        if (isZoneSquare(r, c)) return false;
        var cl = cellAt(r, c);
        if (cl && cl.playerId !== stack.playerId && cl.shape === stack.shape) return false;
        r += dr; c += dc;
      }
      return true;
    }
    function _canReach(stack, fr, fc) {
      var mx = maxMove(stack), sqs = zoneSquares();
      for (var i = 0; i < sqs.length; i++) {
        var sq = sqs[i];
        var straight = fr === sq.row || fc === sq.col;
        var diag = Math.abs(sq.row - fr) === Math.abs(sq.col - fc);
        if (!straight && !diag) continue;
        var d = _dist(fr, fc, sq.row, sq.col);
        if (d === 0 || d > mx) continue;
        if (!_pathClear(stack, fr, fc, sq.row, sq.col)) continue;
        return true;
      }
      return false;
    }
    function _vmToZone(stack, fr, fc) {
      if (!_canReach(stack, fr, fc)) return { ok: false };
      var zs = snap.flagZone.stack;
      if (!zs) return { ok: true, type: 'enter' };
      if (zs.playerId === stack.playerId) {
        return zs.shape === stack.shape ? { ok: true, type: 'merge' } : { ok: false };
      }
      if (zs.hasFlag && (snap.flagZone.holdTurns || 0) < 2) return { ok: false };
      if (zs.shape === stack.shape) return { ok: false };
      return shapeBeats(stack.shape, zs.shape) ? { ok: true, type: 'capture' } : { ok: false };
    }
    function _vm(stack, fr, fc, tr, tc) {
      if (isZoneSquare(tr, tc)) return _vmToZone(stack, fr, fc);
      if (!inBounds(tr, tc)) return { ok: false };
      var d = _dist(fr, fc, tr, tc);
      if (d === 0 || d > maxMove(stack)) return { ok: false };
      var straight = fr === tr || fc === tc;
      var diag = Math.abs(tr - fr) === Math.abs(tc - fc);
      if (!straight && !diag) return { ok: false };
      if (!_pathClear(stack, fr, fc, tr, tc)) return { ok: false };
      var dest = cellAt(tr, tc);
      if (!dest) return { ok: true, type: 'move' };
      if (dest.playerId === stack.playerId) {
        return dest.shape === stack.shape ? { ok: true, type: 'merge' } : { ok: false };
      }
      if (dest.shape === stack.shape) return { ok: false };
      return shapeBeats(stack.shape, dest.shape)
        ? { ok: true, type: 'capture', destHasFlag: dest.hasFlag } : { ok: false };
    }
    function _vmFromZone(stack, tr, tc) {
      if (!inBounds(tr, tc) || isZoneSquare(tr, tc) || !isAdjacentToZone(tr, tc)) return { ok: false };
      var dest = cellAt(tr, tc);
      if (!dest) return { ok: true, type: 'move' };
      if (dest.playerId === stack.playerId) {
        return dest.shape === stack.shape ? { ok: true, type: 'merge' } : { ok: false };
      }
      if (dest.shape === stack.shape) return { ok: false };
      return shapeBeats(stack.shape, dest.shape)
        ? { ok: true, type: 'capture', destHasFlag: dest.hasFlag } : { ok: false };
    }
    function _isHome(side, r, c) {
      if (side === 'south') return r === BOARD_SIZE - 1;
      if (side === 'north') return r === 0;
      if (side === 'west') return c === 0;
      if (side === 'east') return c === BOARD_SIZE - 1;
      return false;
    }
    function _canPlace(player, shape, r, c) {
      if (isZoneSquare(r, c) || !_isHome(player.side, r, c)) return false;
      if (snap.supplies[player.id][shape] <= 0) return false;
      var t = cellAt(r, c);
      if (!t) return true;
      return t.playerId === player.id && t.shape === shape;
    }
    function _opp(side) {
      if (side === 'south') return 'north';
      if (side === 'north') return 'south';
      if (side === 'west') return 'east';
      if (side === 'east') return 'west';
      return 'north';
    }
    function _homeSqs(side) {
      var sq = [], i;
      if (side === 'south') { for (i = 0; i < BOARD_SIZE; i++) sq.push({ row: BOARD_SIZE - 1, col: i }); }
      else if (side === 'north') { for (i = 0; i < BOARD_SIZE; i++) sq.push({ row: 0, col: i }); }
      else if (side === 'west') { for (i = 0; i < BOARD_SIZE; i++) sq.push({ row: i, col: 0 }); }
      else if (side === 'east') { for (i = 0; i < BOARD_SIZE; i++) sq.push({ row: i, col: BOARD_SIZE - 1 }); }
      return sq;
    }
    return {
      board: snap.board, flagZone: snap.flagZone, flag: snap.flag,
      supplies: snap.supplies, players: snap.players,
      cellAt: cellAt, validMove: _vm, validMoveToZone: _vmToZone,
      validMoveFromZone: _vmFromZone, canPlace: _canPlace,
      canReachZoneSquare: _canReach, maxMoveForStack: maxMove,
      shapeBeats: shapeBeats, homeSquaresFor: _homeSqs,
      oppositeSide: _opp, playerById: playerById,
    };
  }

  function applyMoveToSnapshot(snap, playerId, cand) {
    if (cand.type === 'place') {
      var t = snap.board[cand.row][cand.col];
      if (t && t.playerId === playerId && t.shape === cand.shape) {
        t.height += 1;
      } else {
        snap.board[cand.row][cand.col] = {
          playerId: playerId, shape: cand.shape, height: 1, hasFlag: false,
        };
      }
      if (snap.supplies[playerId]) snap.supplies[playerId][cand.shape] -= 1;
      return;
    }
    // ── move ──
    var stk;
    if (cand.fromInZone) {
      stk = snap.flagZone.stack;
      snap.flagZone.stack = null;
    } else {
      stk = snap.board[cand.fromRow][cand.fromCol];
      snap.board[cand.fromRow][cand.fromCol] = null;
    }
    if (!stk) return;
    // clone so original candidate refs stay clean
    stk = { playerId: stk.playerId, shape: stk.shape, height: stk.height, hasFlag: stk.hasFlag };

    if (cand.toInZone) {
      var occ = snap.flagZone.stack;
      if (!occ) {
        snap.flagZone.stack = stk;
      } else if (occ.playerId === stk.playerId && occ.shape === stk.shape) {
        occ.height += stk.height;
        if (stk.hasFlag) occ.hasFlag = true;
      } else if (occ.playerId !== stk.playerId) {
        if (occ.hasFlag) { stk.hasFlag = true; snap.flag.carriedBy = playerId; }
        snap.flagZone.stack = stk;
      }
      // neutral flag pickup
      if (snap.flag.zone && snap.flag.carriedBy === null && snap.flagZone.stack) {
        snap.flagZone.stack.hasFlag = true;
        snap.flag.carriedBy = playerId;
      }
      if (snap.flagZone.stack && snap.flagZone.stack.hasFlag) {
        snap.flag.zone = true; snap.flag.row = null; snap.flag.col = null;
      }
      snap.flagZone.holdTurns = 0;
    } else {
      var dest = snap.board[cand.toRow][cand.toCol];
      if (!dest) {
        snap.board[cand.toRow][cand.toCol] = stk;
      } else if (dest.playerId === stk.playerId && dest.shape === stk.shape) {
        dest.height += stk.height;
        if (stk.hasFlag) dest.hasFlag = true;
      } else if (dest.playerId !== stk.playerId) {
        if (dest.hasFlag) { stk.hasFlag = true; snap.flag.carriedBy = playerId; snap.flag.zone = false; }
        snap.board[cand.toRow][cand.toCol] = stk;
      }
      var final = snap.board[cand.toRow][cand.toCol];
      if (final && final.hasFlag) {
        snap.flag.zone = false; snap.flag.row = cand.toRow; snap.flag.col = cand.toCol;
      }
    }
    // advance zone hold turns when zone not involved
    if (snap.flagZone.stack && !cand.toInZone && !cand.fromInZone) {
      snap.flagZone.holdTurns = (snap.flagZone.holdTurns || 0) + 1;
    }
  }

  function enemyCanWinNext(playerId, simCtx) {
    for (var pi = 0; pi < simCtx.players.length; pi++) {
      var enemy = simCtx.players[pi];
      if (enemy.id === playerId) continue;
      if (simCtx.flag.carriedBy !== enemy.id) continue;
      var carrier = findCarrier(enemy.id, simCtx);
      if (!carrier) continue;
      var winEdge = simCtx.oppositeSide(enemy.side);
      var winSqs = simCtx.homeSquaresFor(winEdge);
      if (carrier.inZone) {
        for (var wi = 0; wi < winSqs.length; wi++) {
          if (!isAdjacentToZone(winSqs[wi].row, winSqs[wi].col)) continue;
          if (simCtx.validMoveFromZone(carrier.stack, winSqs[wi].row, winSqs[wi].col).ok) return true;
        }
      } else {
        for (var wi = 0; wi < winSqs.length; wi++) {
          if (simCtx.validMove(carrier.stack, carrier.row, carrier.col,
                               winSqs[wi].row, winSqs[wi].col).ok) return true;
        }
      }
    }
    return false;
  }

  function twoPlyAdjust(player, cand, config, ctx) {
    var adjust = 0;
    var snap = cloneSnapshot(ctx);
    applyMoveToSnapshot(snap, player.id, cand);
    var simCtx = buildInternalCtx(snap);

    // 1) Immediate loss: any enemy can win next turn
    if (enemyCanWinNext(player.id, simCtx)) {
      adjust += config.immediateLossPenalty;
    }

    // 2) Flag carrier safety after our move
    if (simCtx.flag.carriedBy === player.id) {
      var carrier = findCarrier(player.id, simCtx);
      if (carrier) {
        var cRisk = estimateCaptureRisk(
          player.id, carrier.stack.shape,
          carrier.inZone ? ZONE_ANCHOR.row : carrier.row,
          carrier.inZone ? ZONE_ANCHOR.col : carrier.col,
          carrier.inZone, simCtx
        );
        if (cRisk > 0) adjust += config.carrierThreatPenalty * cRisk;
      }
    }

    // 3) General stack safety — competitive only (penalty !== 0)
    if (config.generalCapturePenalty) {
      var stacks = friendlyStacks(player.id, simCtx);
      for (var si = 0; si < stacks.length; si++) {
        var ms = stacks[si];
        if (ms.stack.height < (config.safetyMinHeight || 2)) continue;
        var sRisk = estimateCaptureRisk(
          player.id, ms.stack.shape, ms.row, ms.col, ms.inZone, simCtx
        );
        adjust += config.generalCapturePenalty * sRisk * Math.max(1, ms.stack.height * 0.5);
      }
    }

    // 4) Opponent best counter-move — competitive only (weight !== 0)
    if (config.counterMoveWeight) {
      var bestCounter = 0;
      for (var epi = 0; epi < simCtx.players.length; epi++) {
        var enemyP = simCtx.players[epi];
        if (enemyP.id === player.id) continue;
        var eMoves = generateMoveCandidates(enemyP, simCtx);
        for (var ei = 0; ei < eMoves.length; ei++) {
          var em = eMoves[ei];
          var capVal = 0;
          if (em.evalMove && em.evalMove.type === 'capture') {
            capVal = 2.0 + (em.dest ? em.dest.height : 0);
            if (em.evalMove.destHasFlag) capVal += 8.0;
          }
          if (capVal > bestCounter) bestCounter = capVal;
        }
      }
      adjust += config.counterMoveWeight * bestCounter;
    }

    // 5) Escort bonus — reward friendly pieces near our carrier post-move
    if (config.escortBonus && simCtx.flag.carriedBy === player.id) {
      var escCarrier = findCarrier(player.id, simCtx);
      if (escCarrier && !escCarrier.inZone) {
        var escortCount = 0;
        var escStacks = friendlyStacks(player.id, simCtx);
        for (var esi = 0; esi < escStacks.length; esi++) {
          var es = escStacks[esi];
          if (es.stack.hasFlag || es.inZone) continue;
          if (chebyshev(es.row, es.col, escCarrier.row, escCarrier.col) <= 2) {
            escortCount++;
          }
        }
        adjust += config.escortBonus * escortCount;
      }
    }

    // 6) Route-block bonus — reward blocking enemy carrier's path to winning edge
    if (config.routeBlockBonus) {
      for (var rbi = 0; rbi < simCtx.players.length; rbi++) {
        var rbEnemy = simCtx.players[rbi];
        if (rbEnemy.id === player.id) continue;
        if (simCtx.flag.carriedBy !== rbEnemy.id) continue;
        var rbCarrier = findCarrier(rbEnemy.id, simCtx);
        if (!rbCarrier || rbCarrier.inZone) continue;
        var rbWinEdge = simCtx.oppositeSide(rbEnemy.side);
        var rbWinRow = (rbWinEdge === 'north') ? 0 : (rbWinEdge === 'south') ? BOARD_SIZE - 1 : -1;
        if (rbWinRow === -1) continue; // only handle north/south for simplicity
        var blockerCount = 0;
        var rbStacks = friendlyStacks(player.id, simCtx);
        for (var rsi = 0; rsi < rbStacks.length; rsi++) {
          var rs = rbStacks[rsi];
          if (rs.inZone) continue;
          // Check if this stack is between the enemy carrier and their winning edge
          var colDiff = Math.abs(rs.col - rbCarrier.col);
          if (colDiff > 1) continue; // within 1 column of carrier
          if (rbWinRow < rbCarrier.row) {
            // Enemy heading north (toward row 0)
            if (rs.row < rbCarrier.row && rs.row >= rbWinRow) blockerCount++;
          } else {
            // Enemy heading south (toward row 7)
            if (rs.row > rbCarrier.row && rs.row <= rbWinRow) blockerCount++;
          }
        }
        adjust += config.routeBlockBonus * blockerCount;
      }
    }

    return adjust;
  }

  // ── Candidate evaluation ───────────────────────────────────

  function evaluateCandidate(player, cand, difficulty, ctx, rng) {
    var profile = activeAiProfile(player, difficulty);
    var w = profile.weights;
    var mods = getDifficultyWeightMods(difficulty);
    var difficultyKey = normalizeDifficulty(difficulty);
    var score = 0;
    var objective = objectiveFor(player, ctx);
    var enemyCarrier = getEnemyCarrier(player.id, ctx);
    var carrierWinSquares = enemyCarrier ? carrierWinningSquares(enemyCarrier, ctx) : [];
    var carrierWinThreat = carrierWinSquares.length > 0;

    if (cand.type === 'move') {
      var before = distanceToObjective(
        { row: cand.fromRow, col: cand.fromCol, inZone: cand.fromInZone },
        objective
      );
      var after = distanceToObjective(
        { row: cand.toRow, col: cand.toCol, inZone: cand.toInZone },
        objective
      );
      score += w.advance * mods.objective * (before - after);

      if (cand.evalMove.type === 'capture') {
        var capHeight = cand.dest ? cand.dest.height : 1;
        var flagBonus = cand.dest && cand.dest.hasFlag ? 4 : 0;
        score += w.capture * mods.capture * (1 + capHeight * 0.4 + flagBonus);
      }
      if (cand.evalMove.type === 'merge') score += w.build * mods.build * 1.2;

      if (
        ctx.flag.carriedBy === null &&
        ((ctx.flag.zone && cand.toInZone) ||
          (!ctx.flag.zone && cand.toRow === ctx.flag.row && cand.toCol === ctx.flag.col))
      ) {
        score += w.flag * mods.objective * 5;
      }

      if (cand.stack.hasFlag) {
        var fromRow = cand.fromInZone ? ZONE_ANCHOR.row : cand.fromRow;
        var fromCol = cand.fromInZone ? ZONE_ANCHOR.col : cand.fromCol;
        var toRow = cand.toInZone ? ZONE_ANCHOR.row : cand.toRow;
        var toCol = cand.toInZone ? ZONE_ANCHOR.col : cand.toCol;
        var homeBefore = distanceToHomeEdge(ctx.oppositeSide(player.side), fromRow, fromCol);
        var homeAfter = distanceToHomeEdge(ctx.oppositeSide(player.side), toRow, toCol);
        score += w.home * mods.home * (homeBefore - homeAfter) * 1.4;
      }

      var carrier = findCarrier(player.id, ctx);
      if (!cand.stack.hasFlag && carrier) {
        var carrierDist = distanceToObjective(
          { row: cand.toRow, col: cand.toCol, inZone: cand.toInZone },
          { row: carrier.row, col: carrier.col, inZone: carrier.inZone }
        );
        score += w.support * mods.objective * (3 - Math.min(3, carrierDist));
      }

      var risk = estimateCaptureRisk(player.id, cand.stack.shape, cand.toRow, cand.toCol, cand.toInZone, ctx);
      score -= w.risk * mods.risk * risk;

      if (ctx.flag.zone && ctx.flag.carriedBy === null) {
        if (cand.toInZone) score += w.zone * mods.zone * 4;
        if (!cand.toInZone && isAdjacentToZone(cand.toRow, cand.toCol)) score += w.zone * mods.zone;
      }

      if (enemyCarrier) {
        var carrierLoc = {
          row: enemyCarrier.row, col: enemyCarrier.col, inZone: enemyCarrier.inZone,
        };
        var afterDist = distanceToObjective(
          { row: cand.toRow, col: cand.toCol, inZone: cand.toInZone },
          carrierLoc
        );
        score += w.intercept * mods.intercept * (3 - Math.min(3, afterDist)) * (carrierWinThreat ? 1.4 : 1.0);

        if (sameLoc({ row: cand.toRow, col: cand.toCol, inZone: cand.toInZone }, carrierLoc)) {
          if (cand.evalMove.type === 'capture') {
            score += w.intercept * mods.intercept * 4;
          }
        } else if (canCaptureTargetFrom(
          cand.stack,
          { row: cand.toRow, col: cand.toCol, inZone: cand.toInZone },
          carrierLoc,
          enemyCarrier.stack,
          ctx
        )) {
          score += w.intercept * mods.intercept * 2;
        }

        if (!cand.toInZone && carrierWinThreat) {
          for (var qi = 0; qi < carrierWinSquares.length; qi++) {
            var sq = carrierWinSquares[qi];
            if (sq.row === cand.toRow && sq.col === cand.toCol) {
              if (!ctx.shapeBeats(enemyCarrier.stack.shape, cand.stack.shape)) {
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
      // placement
      var dist = distanceToObjective(
        { row: cand.row, col: cand.col, inZone: false },
        objective
      );
      score += w.advance * mods.objective * ((8 - dist) * 0.5);
      var cell = ctx.cellAt(cand.row, cand.col);
      if (cell && cell.playerId === player.id && cell.shape === cand.shape) {
        score += w.build * mods.build;
      }
      var nearby = adjacentEnemies(cand.row, cand.col, player.id, ctx);
      for (var ni = 0; ni < nearby.length; ni++) {
        if (ctx.shapeBeats(cand.shape, nearby[ni].shape)) score += w.capture * mods.capture * 0.4;
        if (ctx.shapeBeats(nearby[ni].shape, cand.shape)) score -= w.risk * mods.risk * 0.3;
      }

      if (ctx.flag.zone && ctx.flag.carriedBy === null && isAdjacentToZone(cand.row, cand.col)) {
        score += w.zone * mods.zone * 0.6;
      }
      if (enemyCarrier && ctx.shapeBeats(cand.shape, enemyCarrier.stack.shape)) {
        var distToCarrier = distanceToObjective(
          { row: cand.row, col: cand.col, inZone: false },
          { row: enemyCarrier.row, col: enemyCarrier.col, inZone: enemyCarrier.inZone }
        );
        score += w.intercept * mods.intercept * (2 - Math.min(2, distToCarrier / 2));
      }
    }

    // 2-ply lookahead for hard/competitive
    var twoPlyCfg = TWO_PLY_CONFIG[difficultyKey];
    if (twoPlyCfg) {
      score += twoPlyAdjust(player, cand, twoPlyCfg, ctx);
    }

    var randomnessScale =
      difficultyKey === 'competitive' ? 0.0 : difficultyKey === 'hard' ? 0.0 : difficultyKey === 'easy' ? 1.35 : 1.0;
    var jitter = (rng() - 0.5) * profile.randomness * randomnessScale;
    return score + jitter;
  }

  // ── Candidate selection ────────────────────────────────────

  function chooseAiCandidate(scored, difficulty, rng) {
    if (!scored.length) return null;
    var diff = getDifficultySettings(difficulty);
    var jittered = [];
    for (var i = 0; i < scored.length; i++) {
      jittered.push({
        candidate: scored[i],
        adjustedScore: scored[i].score + (rng() - 0.5) * diff.scoreJitter,
      });
    }
    jittered.sort(function (a, b) { return b.adjustedScore - a.adjustedScore; });

    if (rng() < diff.blunderChance) {
      var n = Math.min(diff.blunderTopN, jittered.length);
      return jittered[Math.floor(rng() * n)].candidate;
    }

    var n2 = Math.min(diff.topN, jittered.length);
    return jittered[Math.floor(rng() * n2)].candidate;
  }

  // ── Top-level orchestration ────────────────────────────────

  /**
   * Pure action selection — no side effects.
   * Returns the chosen candidate with .score, or null if no candidates.
   *
   * @param {object} player  — player object with .id, .side, .aiProfile, etc.
   * @param {string} difficulty — 'easy' | 'normal' | 'hard' | 'competitive'
   * @param {object} ctx — context providing board state and helper functions
   * @param {function} rng — random number generator (() => number in [0,1))
   * @returns {object|null} chosen candidate or null
   */
  function selectAction(player, difficulty, ctx, rng) {
    var moveCandidates = generateMoveCandidates(player, ctx);
    var placeCandidates = generatePlacementCandidates(player, ctx);
    var candidates = moveCandidates.concat(placeCandidates);
    if (candidates.length === 0) return null;

    var scored = [];
    for (var i = 0; i < candidates.length; i++) {
      var cand = candidates[i];
      cand.score = evaluateCandidate(player, cand, difficulty, ctx, rng);
      scored.push(cand);
    }
    return chooseAiCandidate(scored, difficulty, rng);
  }

  function describeAiChoice(player, cand, difficulty) {
    var profile = activeAiProfile(player, difficulty);
    if (cand.type === 'move') {
      var action =
        cand.evalMove.type === 'capture' ? 'captures'
        : cand.evalMove.type === 'merge' ? 'merges'
        : 'moves';
      return player.name + ' (' + profile.name + ') ' + action + ' ' +
        cand.stack.shape + ' from ' + coord(cand.fromRow, cand.fromCol) +
        ' to ' + coord(cand.toRow, cand.toCol) +
        ' [score ' + cand.score.toFixed(2) + '].';
    }
    return player.name + ' (' + profile.name + ') places ' +
      cand.shape + ' at ' + coord(cand.row, cand.col) +
      ' [score ' + cand.score.toFixed(2) + '].';
  }

  // ── Public API ─────────────────────────────────────────────

  return {
    // Data
    AI_PROFILES: AI_PROFILES,
    COMPETITIVE_AI_PROFILE: COMPETITIVE_AI_PROFILE,
    COMPETITIVE_MAX_PROFILE: COMPETITIVE_MAX_PROFILE,
    AI_DIFFICULTY_SETTINGS: AI_DIFFICULTY_SETTINGS,
    AI_DIFFICULTY_WEIGHT_MODS: AI_DIFFICULTY_WEIGHT_MODS,
    BOARD_SIZE: BOARD_SIZE,
    SHAPES: SHAPES,

    // Main entry
    selectAction: selectAction,
    describeAiChoice: describeAiChoice,

    // Configuration
    activeAiProfile: activeAiProfile,
    getDifficultySettings: getDifficultySettings,
    getDifficultyWeightMods: getDifficultyWeightMods,
    normalizeDifficulty: normalizeDifficulty,

    // Candidate generation (for testing)
    generateMoveCandidates: generateMoveCandidates,
    generatePlacementCandidates: generatePlacementCandidates,

    // Evaluation (for testing)
    evaluateCandidate: evaluateCandidate,
    chooseAiCandidate: chooseAiCandidate,
    estimateCaptureRisk: estimateCaptureRisk,

    // 2-ply simulation (for testing)
    cloneSnapshot: cloneSnapshot,
    buildInternalCtx: buildInternalCtx,
    applyMoveToSnapshot: applyMoveToSnapshot,
    enemyCanWinNext: enemyCanWinNext,
    twoPlyAdjust: twoPlyAdjust,
    TWO_PLY_CONFIG: TWO_PLY_CONFIG,

    // Helpers (for testing)
    objectiveFor: objectiveFor,
    findCarrier: findCarrier,
    getEnemyCarrier: getEnemyCarrier,
    friendlyStacks: friendlyStacks,
    adjacentEnemies: adjacentEnemies,
    carrierWinningSquares: carrierWinningSquares,
    distanceToObjective: distanceToObjective,
    distanceToHomeEdge: distanceToHomeEdge,
    homeTargetFor: homeTargetFor,
    sameLoc: sameLoc,
    coord: coord,
  };
});
