(function attachDouroDashCore(global) {
  "use strict";

  const BOARD_WIDTH = 5;
  const BOARD_HEIGHT = 6;
  const DIRECTIONS = Object.freeze({
    up: Object.freeze({ x: 0, y: -1 }),
    right: Object.freeze({ x: 1, y: 0 }),
    down: Object.freeze({ x: 0, y: 1 }),
    left: Object.freeze({ x: -1, y: 0 })
  });

  const LEVELS = Object.freeze([
    {
      id: 1,
      name: "Ribeira Warm-Up",
      subtitle: "An easy first loop from the quay.",
      moves: 12,
      target: 4,
      dock: [2, 5],
      cargo: [[2, 3, 1], [1, 2, 3], [3, 2, 3], [0, 4, 1], [4, 4, 1]],
      reefs: [],
      currents: []
    },
    {
      id: 2,
      name: "Cellars Run",
      subtitle: "Choose between the near crates and the long haul.",
      moves: 12,
      target: 5,
      dock: [0, 5],
      cargo: [[0, 3, 1], [1, 4, 1], [2, 3, 3], [4, 3, 5], [1, 1, 3]],
      reefs: [],
      currents: []
    },
    {
      id: 3,
      name: "Six Bridges",
      subtitle: "The richest crate is not always the best first stop.",
      moves: 12,
      target: 6,
      dock: [4, 5],
      cargo: [[4, 3, 1], [2, 3, 3], [0, 3, 5], [3, 1, 5], [1, 4, 3]],
      reefs: [],
      currents: []
    },
    {
      id: 4,
      name: "São João Stream",
      subtitle: "Let the river carry you toward the fireworks.",
      moves: 10,
      target: 7,
      dock: [2, 5],
      cargo: [[2, 4, 1], [2, 3, 3], [2, 1, 5], [0, 3, 3], [4, 3, 3]],
      reefs: [],
      currents: [[2, 4, 0, -1]]
    },
    {
      id: 5,
      name: "Gaia Shortcut",
      subtitle: "A sideways route hides the quickest return.",
      moves: 11,
      target: 8,
      dock: [0, 5],
      cargo: [[1, 4, 1], [2, 3, 3], [3, 2, 5], [4, 4, 3], [2, 4, 3]],
      reefs: [],
      currents: [[1, 4, 0, -1]]
    },
    {
      id: 6,
      name: "Regatta Line",
      subtitle: "Two streams make a fast racing line.",
      moves: 9,
      target: 12,
      dock: [4, 4],
      cargo: [[3, 4, 1], [2, 4, 3], [2, 2, 3], [2, 1, 5], [4, 1, 3]],
      reefs: [],
      currents: [[3, 4, -1, 0], [2, 2, 0, -1]]
    },
    {
      id: 7,
      name: "Granite Gate",
      subtitle: "The glittering crate beyond the rocks is a trap.",
      moves: 10,
      target: 7,
      dock: [2, 5],
      cargo: [[1, 4, 3], [3, 4, 3], [0, 5, 1], [4, 5, 1], [2, 1, 5]],
      reefs: [[2, 3], [1, 2], [3, 2]],
      currents: []
    },
    {
      id: 8,
      name: "Vineyard Bend",
      subtitle: "Ride the bank-side current before turning inland.",
      moves: 7,
      target: 9,
      dock: [0, 5],
      cargo: [[0, 4, 1], [0, 3, 3], [1, 2, 5], [4, 2, 5], [4, 5, 3]],
      reefs: [[2, 4], [2, 3], [3, 3]],
      currents: [[0, 4, 0, -1]]
    },
    {
      id: 9,
      name: "Fog over Freixo",
      subtitle: "Stay near the eastern bank and plan the turn home.",
      moves: 9,
      target: 10,
      dock: [4, 5],
      cargo: [[4, 4, 1], [4, 3, 3], [4, 1, 5], [3, 1, 1], [0, 4, 5]],
      reefs: [[2, 4], [2, 3], [1, 3]],
      currents: [[4, 4, 0, -1]]
    },
    {
      id: 10,
      name: "Rapids at Dawn",
      subtitle: "The western channels are the only way home in time.",
      moves: 7,
      target: 10,
      dock: [2, 5],
      cargo: [[1, 5, 1], [0, 5, 3], [0, 4, 1], [0, 3, 5], [4, 4, 5], [4, 2, 3]],
      reefs: [[1, 4], [2, 2], [3, 3], [3, 4]],
      currents: [[1, 5, -1, 0], [0, 4, 0, -1]]
    },
    {
      id: 11,
      name: "Douro Lock",
      subtitle: "Commit to the lock channel and leave no move unused.",
      moves: 7,
      target: 10,
      dock: [4, 5],
      cargo: [[3, 5, 1], [2, 5, 3], [2, 4, 1], [2, 3, 5], [4, 2, 5], [4, 1, 3]],
      reefs: [[1, 4], [1, 3], [3, 4], [3, 2]],
      currents: [[3, 5, -1, 0], [2, 4, 0, -1]]
    },
    {
      id: 12,
      name: "Atlantic Homecoming",
      subtitle: "One perfect cargo line closes the voyage.",
      moves: 8,
      target: 13,
      dock: [0, 5],
      cargo: [[1, 5, 1], [2, 5, 3], [2, 4, 1], [2, 3, 5], [3, 3, 3], [4, 4, 5], [4, 2, 5]],
      reefs: [[1, 4], [3, 4], [4, 3], [2, 2], [0, 2]],
      currents: [[1, 5, 1, 0], [2, 4, 0, -1]]
    }
  ]);

  function key(x, y) {
    return `${x},${y}`;
  }

  function insideBoard(x, y) {
    return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
  }

  function normalizeLevel(level) {
    return {
      ...level,
      dock: { x: level.dock[0], y: level.dock[1] },
      cargo: level.cargo.map(([x, y, value], index) => ({ x, y, value, index })),
      reefs: level.reefs.map(([x, y]) => ({ x, y })),
      currents: level.currents.map(([x, y, dx, dy]) => ({ x, y, dx, dy }))
    };
  }

  const NORMALIZED_LEVELS = LEVELS.map(normalizeLevel);

  function createLookup(level) {
    return {
      reef: new Set(level.reefs.map((item) => key(item.x, item.y))),
      current: new Map(level.currents.map((item) => [key(item.x, item.y), item])),
      cargo: new Map(level.cargo.map((item) => [key(item.x, item.y), item]))
    };
  }

  function getMove(level, position, directionName, options = {}) {
    const direction = DIRECTIONS[directionName];
    if (!direction) return { valid: false, reason: "direction" };

    const lookup = options.lookup || createLookup(level);
    const next = { x: position.x + direction.x, y: position.y + direction.y };
    if (!insideBoard(next.x, next.y)) return { valid: false, reason: "edge" };
    if (lookup.reef.has(key(next.x, next.y))) return { valid: false, reason: "reef" };

    const path = [next];
    const current = options.disableCurrents ? null : lookup.current.get(key(next.x, next.y));
    if (current) {
      const landing = { x: next.x + current.dx, y: next.y + current.dy };
      if (!insideBoard(landing.x, landing.y) || lookup.reef.has(key(landing.x, landing.y))) {
        return { valid: false, reason: "invalid-current" };
      }
      path.push(landing);
    }

    return {
      valid: true,
      path,
      position: path[path.length - 1],
      usedCurrent: Boolean(current),
      current
    };
  }

  function cargoAlongPath(level, path, collectedMask = 0, lookup = createLookup(level)) {
    let nextMask = collectedMask;
    let gained = 0;
    const collected = [];
    path.forEach((position) => {
      const cargo = lookup.cargo.get(key(position.x, position.y));
      if (!cargo || (nextMask & (1 << cargo.index))) return;
      nextMask |= 1 << cargo.index;
      gained += cargo.value;
      collected.push(cargo);
    });
    return { mask: nextMask, gained, collected };
  }

  function scoreMask(level, mask) {
    return level.cargo.reduce((score, cargo) => score + ((mask & (1 << cargo.index)) ? cargo.value : 0), 0);
  }

  function analyzeLevel(level, options = {}) {
    const lookup = createLookup(level);
    const memo = new Map();
    const routeCap = options.routeCap || 1000000;

    function visit(x, y, movesLeft, mask, leftDock, usedCurrent) {
      const stateKey = `${x},${y}|${movesLeft}|${mask}|${leftDock ? 1 : 0}|${usedCurrent ? 1 : 0}`;
      if (memo.has(stateKey)) return memo.get(stateKey);

      let routes = 0;
      let bestScore = 0;
      let currentRoutes = 0;
      let sample = null;

      if (movesLeft <= 0) {
        const result = { routes, bestScore, currentRoutes, sample };
        memo.set(stateKey, result);
        return result;
      }

      Object.keys(DIRECTIONS).forEach((directionName) => {
        const move = getMove(level, { x, y }, directionName, {
          lookup,
          disableCurrents: Boolean(options.disableCurrents)
        });
        if (!move.valid) return;

        const cargo = cargoAlongPath(level, move.path, mask, lookup);
        const nextMoves = movesLeft - 1;
        const nextUsedCurrent = usedCurrent || move.usedCurrent;
        const docked = leftDock && move.position.x === level.dock.x && move.position.y === level.dock.y;

        if (docked) {
          const banked = scoreMask(level, cargo.mask);
          if (banked >= level.target) {
            routes = Math.min(routeCap, routes + 1);
            bestScore = Math.max(bestScore, banked);
            if (nextUsedCurrent) currentRoutes = Math.min(routeCap, currentRoutes + 1);
            if (!sample) sample = [directionName];
          }
          return;
        }

        if (nextMoves === 0) return;
        const child = visit(
          move.position.x,
          move.position.y,
          nextMoves,
          cargo.mask,
          true,
          nextUsedCurrent
        );
        routes = Math.min(routeCap, routes + child.routes);
        bestScore = Math.max(bestScore, child.bestScore);
        currentRoutes = Math.min(routeCap, currentRoutes + child.currentRoutes);
        if (!sample && child.sample) sample = [directionName, ...child.sample];
      });

      const result = { routes, bestScore, currentRoutes, sample };
      memo.set(stateKey, result);
      return result;
    }

    const result = visit(level.dock.x, level.dock.y, level.moves, 0, false, false);
    return { ...result, states: memo.size };
  }

  function validateLevel(level) {
    const errors = [];
    const seenCargo = new Set();
    const lookup = createLookup(level);

    if (level.moves < 1) errors.push("Move budget must be positive.");
    if (level.target < 1) errors.push("Target must be positive.");
    if (!insideBoard(level.dock.x, level.dock.y)) errors.push("Dock is outside the board.");
    if (lookup.reef.has(key(level.dock.x, level.dock.y))) errors.push("Dock overlaps a reef.");

    level.reefs.forEach((reef) => {
      if (!insideBoard(reef.x, reef.y)) errors.push(`Reef ${key(reef.x, reef.y)} is outside the board.`);
    });

    level.cargo.forEach((cargo) => {
      const cargoKey = key(cargo.x, cargo.y);
      if (!insideBoard(cargo.x, cargo.y)) errors.push(`Cargo ${cargoKey} is outside the board.`);
      if (lookup.reef.has(cargoKey)) errors.push(`Cargo ${cargoKey} overlaps a reef.`);
      if (cargo.x === level.dock.x && cargo.y === level.dock.y) errors.push("Cargo overlaps the dock.");
      if (seenCargo.has(cargoKey)) errors.push(`Duplicate cargo at ${cargoKey}.`);
      if (![1, 3, 5].includes(cargo.value)) errors.push(`Cargo ${cargoKey} has an invalid value.`);
      seenCargo.add(cargoKey);
    });

    level.currents.forEach((current) => {
      const landing = { x: current.x + current.dx, y: current.y + current.dy };
      if (!insideBoard(current.x, current.y)) errors.push(`Current ${key(current.x, current.y)} is outside the board.`);
      if (!insideBoard(landing.x, landing.y)) errors.push(`Current ${key(current.x, current.y)} lands outside the board.`);
      if (lookup.reef.has(key(current.x, current.y))) errors.push(`Current ${key(current.x, current.y)} overlaps a reef.`);
      if (lookup.reef.has(key(landing.x, landing.y))) errors.push(`Current ${key(current.x, current.y)} lands on a reef.`);
      if (Math.abs(current.dx) + Math.abs(current.dy) !== 1) errors.push(`Current ${key(current.x, current.y)} has an invalid direction.`);
    });

    const analysis = analyzeLevel(level);
    if (!analysis.routes) errors.push("Target is unreachable.");
    return { valid: errors.length === 0, errors, analysis };
  }

  const api = Object.freeze({
    BOARD_WIDTH,
    BOARD_HEIGHT,
    DIRECTIONS,
    LEVELS: NORMALIZED_LEVELS,
    key,
    insideBoard,
    createLookup,
    getMove,
    cargoAlongPath,
    scoreMask,
    analyzeLevel,
    validateLevel
  });

  global.DouroDashCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
