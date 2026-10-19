"use strict";

/* --------------------------------------------------------------------------
 * Dragon Blocks — game data
 * ----------------------------------------------------------------------- */

const BOARD_COLUMNS = 10;
const BOARD_ROWS = 20;
const CELL_SIZE = 30;
const LEVELS_PER_WORLD = 5;
const TOTAL_LEVELS = 30;
const SAVE_KEY = "ron_dragon_blocks_save_v1";

const PIECES = {
  I: { color: "#39c7ff", matrix: [[1, 1, 1, 1]] },
  J: { color: "#2164ff", matrix: [[1, 0, 0], [1, 1, 1]] },
  L: { color: "#ff9c32", matrix: [[0, 0, 1], [1, 1, 1]] },
  O: { color: "#ffdc43", matrix: [[1, 1], [1, 1]] },
  S: { color: "#46df8c", matrix: [[0, 1, 1], [1, 1, 0]] },
  T: { color: "#a873ff", matrix: [[0, 1, 0], [1, 1, 1]] },
  Z: { color: "#ff5b66", matrix: [[1, 1, 0], [0, 1, 1]] },
};

const WORLDS = [
  {
    name: "Valbom Base Camp",
    shortName: "Valbom",
    color: "#1689e8",
    effect: "Training systems online. Build clean lines and recover the Core fragments.",
    summary: "Learn the controls beside the Douro and activate the first portal.",
    missions: ["First spark", "Bridge builder", "River signal", "Portal charge", "Gate guardian"],
  },
  {
    name: "Blue & White Arena",
    shortName: "Dragon Arena",
    color: "#1d78ff",
    effect: "The crowd boosts combos. Consecutive clears charge Dragon Power faster.",
    summary: "Turn every combo into stadium energy and wake the blue dragon.",
    missions: ["Kick-off", "Blue pressure", "White wall", "Dragon roar", "Arena champion"],
  },
  {
    name: "Crystal Mines",
    shortName: "The Mines",
    color: "#19bfd4",
    effect: "Stone shelves block the mine. Crystals award tools when recovered.",
    summary: "Dig through voxel stone, collect diamonds and unlock useful tools.",
    missions: ["Mine entrance", "Pickaxe path", "Diamond vein", "Deep tunnel", "Crystal golem"],
  },
  {
    name: "Lava Depths",
    shortName: "Lava Depths",
    color: "#ff6f2c",
    effect: "The floor rises. Clear fast before hot garbage rows enter the board.",
    summary: "Outrun the rising lava while explosive block storms shake the cavern.",
    missions: ["Heat warning", "Magma bridge", "Fire blocks", "Core furnace", "Lava titan"],
  },
  {
    name: "Floating Islands",
    shortName: "Sky Islands",
    color: "#8fdfff",
    effect: "Sky wind nudges new pieces. Diamonds can slow the storm.",
    summary: "Master the wind above the clouds and rebuild the aerial portal.",
    missions: ["Cloud step", "East wind", "Sky bridge", "Storm eye", "Cloud serpent"],
  },
  {
    name: "Dragon Citadel",
    shortName: "The Citadel",
    color: "#9b73ff",
    effect: "Every world fights back: wind, rising rows and maximum speed.",
    summary: "Enter the final fortress and restore the complete Dragon Core.",
    missions: ["Outer wall", "Rune chamber", "Dragon stairs", "Core vault", "Final awakening"],
  },
];

/* --------------------------------------------------------------------------
 * DOM references
 * ----------------------------------------------------------------------- */

const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const continueButton = document.getElementById("continue-button");
const resetProgressButton = document.getElementById("reset-progress-button");
const worldGrid = document.getElementById("world-grid");
const menuBestScore = document.getElementById("menu-best-score");
const menuCrystals = document.getElementById("menu-crystals");
const menuMissions = document.getElementById("menu-missions");
const offlineBadge = document.getElementById("offline-badge");

const gameCanvas = document.getElementById("game-canvas");
const gameContext = gameCanvas.getContext("2d");
const nextCanvas = document.getElementById("next-canvas");
const nextContext = nextCanvas.getContext("2d");
const holdCanvas = document.getElementById("hold-canvas");
const holdContext = holdCanvas.getContext("2d");
const boardFrame = document.getElementById("board-frame");
const eventBanner = document.getElementById("event-banner");

const worldName = document.getElementById("world-name");
const levelName = document.getElementById("level-name");
const scoreValue = document.getElementById("score-value");
const missionTitle = document.getElementById("mission-title");
const missionCopy = document.getElementById("mission-copy");
const lineProgress = document.getElementById("line-progress");
const crystalProgress = document.getElementById("crystal-progress");
const lineMeter = document.getElementById("line-meter");
const crystalMeter = document.getElementById("crystal-meter");
const comboValue = document.getElementById("combo-value");
const worldEffect = document.getElementById("world-effect");
const dragonValue = document.getElementById("dragon-value");
const dragonFill = document.getElementById("dragon-fill");
const dragonButton = document.getElementById("dragon-button");

const pickaxeButton = document.getElementById("pickaxe-button");
const tntButton = document.getElementById("tnt-button");
const diamondButton = document.getElementById("diamond-button");
const pickaxeCount = document.getElementById("pickaxe-count");
const tntCount = document.getElementById("tnt-count");
const diamondCount = document.getElementById("diamond-count");
const mapButton = document.getElementById("map-button");
const pauseButton = document.getElementById("pause-button");
const soundButton = document.getElementById("sound-button");

const gameModal = document.getElementById("game-modal");
const modalIcon = document.getElementById("modal-icon");
const modalKicker = document.getElementById("modal-kicker");
const modalTitle = document.getElementById("modal-title");
const modalCopy = document.getElementById("modal-copy");
const modalStats = document.getElementById("modal-stats");
const modalPrimary = document.getElementById("modal-primary");
const modalSecondary = document.getElementById("modal-secondary");
const announcer = document.getElementById("announcer");

/* --------------------------------------------------------------------------
 * Saved progress
 * ----------------------------------------------------------------------- */

function defaultSave() {
  return {
    maxUnlocked: 0,
    completed: [],
    highScore: 0,
    totalCrystals: 0,
    sound: true,
  };
}

function readSave() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY));
    return {
      ...defaultSave(),
      ...stored,
      completed: Array.isArray(stored?.completed) ? stored.completed : [],
    };
  } catch {
    return defaultSave();
  }
}

let save = readSave();

function persistSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // The game remains playable when private browsing blocks local storage.
  }
}

function completedMissionCount() {
  return new Set(save.completed).size;
}

function nextAdventureLevel() {
  for (let level = 0; level <= save.maxUnlocked; level += 1) {
    if (!save.completed.includes(level)) return level;
  }
  return Math.min(save.maxUnlocked, TOTAL_LEVELS - 1);
}

/* --------------------------------------------------------------------------
 * Runtime state
 * ----------------------------------------------------------------------- */

let board = createEmptyBoard();
let activePiece = null;
let nextQueue = [];
let heldType = null;
let canHold = true;
let animationFrame = 0;
let lastFrameTime = 0;
let lastHudUpdate = 0;
let dropAccumulator = 0;
let audioContext = null;
let bannerTimer = 0;
let primaryModalAction = null;
let secondaryModalAction = null;

const game = {
  levelIndex: 0,
  worldIndex: 0,
  stage: 1,
  boss: false,
  targetLines: 7,
  targetCrystals: 1,
  levelLines: 0,
  levelCrystals: 0,
  score: 0,
  combo: -1,
  dragon: 0,
  piecesLocked: 0,
  running: false,
  paused: false,
  slowUntil: 0,
  startedAt: 0,
  inventory: { pickaxe: 1, tnt: 0, diamond: 0 },
};

function createEmptyBoard() {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLUMNS).fill(null));
}

function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function levelConfiguration(levelIndex) {
  const worldIndex = Math.floor(levelIndex / LEVELS_PER_WORLD);
  const stage = (levelIndex % LEVELS_PER_WORLD) + 1;
  const boss = stage === LEVELS_PER_WORLD;
  return {
    worldIndex,
    stage,
    boss,
    targetLines: 5 + stage * 2 + worldIndex * 2 + (boss ? 3 : 0),
    targetCrystals: Math.min(4, 1 + Math.floor((stage - 1) / 2) + Math.floor(worldIndex / 2)),
    dropInterval: Math.max(135, 820 - levelIndex * 19 - (boss ? 45 : 0)),
  };
}

/* --------------------------------------------------------------------------
 * Original sound effects
 * ----------------------------------------------------------------------- */

function ensureAudio() {
  if (!save.sound) return null;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return null;
  if (!audioContext) audioContext = new AudioEngine();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function tone(frequency, duration = 0.08, type = "square", volume = 0.035, delay = 0) {
  const engine = ensureAudio();
  if (!engine) return;
  const start = engine.currentTime + delay;
  const oscillator = engine.createOscillator();
  const gain = engine.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(engine.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playSound(name) {
  if (!save.sound) return;
  const sounds = {
    move: () => tone(150, 0.035, "square", 0.018),
    rotate: () => tone(245, 0.055, "square", 0.025),
    lock: () => tone(105, 0.07, "triangle", 0.04),
    clear: () => [330, 440, 660].forEach((note, index) => tone(note, 0.1, "square", 0.035, index * 0.055)),
    crystal: () => [660, 880, 1175].forEach((note, index) => tone(note, 0.13, "sine", 0.04, index * 0.06)),
    power: () => [165, 247, 330, 494].forEach((note, index) => tone(note, 0.16, "sawtooth", 0.03, index * 0.07)),
    fail: () => [220, 165, 110].forEach((note, index) => tone(note, 0.22, "triangle", 0.04, index * 0.12)),
    win: () => [262, 330, 392, 523, 659].forEach((note, index) => tone(note, 0.19, "square", 0.035, index * 0.08)),
  };
  sounds[name]?.();
}

/* --------------------------------------------------------------------------
 * Piece queue and collision
 * ----------------------------------------------------------------------- */

function shuffledBag() {
  const bag = Object.keys(PIECES);
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }
  return bag;
}

function fillQueue() {
  while (nextQueue.length < 7) nextQueue.push(...shuffledBag());
}

function collides(piece, rowOffset = 0, columnOffset = 0, matrix = piece.matrix) {
  for (let row = 0; row < matrix.length; row += 1) {
    for (let column = 0; column < matrix[row].length; column += 1) {
      if (!matrix[row][column]) continue;
      const boardRow = piece.row + row + rowOffset;
      const boardColumn = piece.column + column + columnOffset;
      if (boardColumn < 0 || boardColumn >= BOARD_COLUMNS || boardRow >= BOARD_ROWS) return true;
      if (boardRow >= 0 && board[boardRow][boardColumn]) return true;
    }
  }
  return false;
}

function countBoardCrystals() {
  return board.flat().filter((cell) => cell?.crystal).length;
}

function chooseCrystalCell(matrix) {
  const filledCells = [];
  matrix.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value) filledCells.push([rowIndex, columnIndex]);
    });
  });
  return filledCells[Math.floor(Math.random() * filledCells.length)] || null;
}

function spawnPiece(forcedType = null) {
  fillQueue();
  const type = forcedType || nextQueue.shift();
  fillQueue();
  const matrix = cloneMatrix(PIECES[type].matrix);
  const crystalsStillNeeded = Math.max(
    0,
    game.targetCrystals - game.levelCrystals - countBoardCrystals(),
  );
  const shouldCarryCrystal =
    crystalsStillNeeded > 0 && (game.piecesLocked % 2 === 0 || Math.random() < 0.42);

  activePiece = {
    type,
    matrix,
    row: 0,
    column: Math.floor((BOARD_COLUMNS - matrix[0].length) / 2),
    crystalCell: shouldCarryCrystal ? chooseCrystalCell(matrix) : null,
  };

  if ((game.worldIndex === 4 || game.worldIndex === 5) && game.piecesLocked > 0) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    if (!collides(activePiece, 0, direction)) activePiece.column += direction;
    showBanner(direction < 0 ? "Sky wind ←" : "Sky wind →");
  }

  if (collides(activePiece)) {
    finishGameOver();
    return;
  }
  drawPreviews();
}

function rotateMatrixClockwise(matrix) {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]).reverse());
}

function rotateCrystalCell(cell, matrixSize) {
  if (!cell) return null;
  return [cell[1], matrixSize - 1 - cell[0]];
}

function movePiece(horizontal, vertical = 0) {
  if (!game.running || game.paused || !activePiece) return false;
  if (collides(activePiece, vertical, horizontal)) return false;
  activePiece.column += horizontal;
  activePiece.row += vertical;
  if (horizontal) playSound("move");
  return true;
}

function rotatePiece() {
  if (!game.running || game.paused || !activePiece) return;
  const rotated = rotateMatrixClockwise(activePiece.matrix);
  const rotatedCrystal = rotateCrystalCell(activePiece.crystalCell, activePiece.matrix.length);
  for (const kick of [0, -1, 1, -2, 2]) {
    if (!collides(activePiece, 0, kick, rotated)) {
      activePiece.matrix = rotated;
      activePiece.column += kick;
      activePiece.crystalCell = rotatedCrystal;
      playSound("rotate");
      return;
    }
  }
}

function softDrop() {
  if (movePiece(0, 1)) {
    game.score += 1;
    dropAccumulator = 0;
  } else if (game.running && !game.paused) {
    lockPiece();
  }
}

function hardDrop() {
  if (!game.running || game.paused || !activePiece) return;
  let distance = 0;
  while (!collides(activePiece, 1, 0)) {
    activePiece.row += 1;
    distance += 1;
  }
  game.score += distance * 2;
  lockPiece();
}

function holdPiece() {
  if (!game.running || game.paused || !activePiece || !canHold) return;
  const currentType = activePiece.type;
  const replacement = heldType;
  heldType = currentType;
  canHold = false;
  spawnPiece(replacement);
  playSound("rotate");
}

/* --------------------------------------------------------------------------
 * Board resolution and world events
 * ----------------------------------------------------------------------- */

function lockPiece() {
  if (!activePiece || !game.running) return;
  activePiece.matrix.forEach((matrixRow, rowIndex) => {
    matrixRow.forEach((value, columnIndex) => {
      if (!value) return;
      const boardRow = activePiece.row + rowIndex;
      const boardColumn = activePiece.column + columnIndex;
      if (boardRow < 0) return;
      board[boardRow][boardColumn] = {
        type: activePiece.type,
        color: PIECES[activePiece.type].color,
        crystal:
          activePiece.crystalCell?.[0] === rowIndex &&
          activePiece.crystalCell?.[1] === columnIndex,
      };
    });
  });

  game.piecesLocked += 1;
  canHold = true;
  playSound("lock");
  const cleared = clearCompletedLines();
  resolveClear(cleared);

  if (!game.running) return;
  triggerWorldEvent();
  if (!game.running) return;
  spawnPiece();
  updateHUD();
}

function clearCompletedLines() {
  const rows = [];
  board.forEach((row, index) => {
    if (row.every(Boolean)) rows.push(index);
  });
  return removeRows(rows);
}

function removeRows(rowIndexes) {
  if (!rowIndexes.length) return { count: 0, crystals: 0 };
  let crystals = 0;
  [...rowIndexes]
    .sort((a, b) => b - a)
    .forEach((rowIndex) => {
      crystals += board[rowIndex].filter((cell) => cell?.crystal).length;
      board.splice(rowIndex, 1);
      board.unshift(Array(BOARD_COLUMNS).fill(null));
    });
  return { count: rowIndexes.length, crystals };
}

function resolveClear({ count, crystals }, source = "lines") {
  if (count > 0) {
    game.combo += 1;
    game.levelLines += count;
    const lineScores = [0, 100, 300, 500, 800];
    const comboBonus = game.combo > 0 ? game.combo * 75 : 0;
    game.score += (lineScores[Math.min(count, 4)] + comboBonus) * (game.levelIndex + 1);
    const arenaMultiplier = game.worldIndex === 1 ? 1.5 : 1;
    game.dragon = Math.min(100, game.dragon + Math.round((count * 18 + game.combo * 7) * arenaMultiplier));
    showBanner(count >= 4 ? "Dragon clear!" : game.combo > 0 ? `Combo ×${game.combo + 1}` : "Line secured");
    playSound("clear");
  } else if (source === "lines") {
    game.combo = -1;
  }

  if (crystals > 0) collectCrystals(crystals);
  updateHUD();
  checkMissionComplete();
}

function collectCrystals(amount) {
  for (let index = 0; index < amount; index += 1) {
    game.levelCrystals += 1;
    save.totalCrystals += 1;
    const rewardCycle = save.totalCrystals % 3;
    if (rewardCycle === 1) game.inventory.pickaxe += 1;
    if (rewardCycle === 2) game.inventory.tnt += 1;
    if (rewardCycle === 0) game.inventory.diamond += 1;
  }
  persistSave();
  showBanner(amount > 1 ? `${amount} crystals recovered` : "Crystal recovered");
  playSound("crystal");
}

function addGarbageRow() {
  if (board[0].some(Boolean)) {
    finishGameOver();
    return;
  }
  board.shift();
  const gap = Math.floor(Math.random() * BOARD_COLUMNS);
  board.push(
    Array.from({ length: BOARD_COLUMNS }, (_, column) =>
      column === gap ? null : { type: "stone", color: "#59677d", crystal: false },
    ),
  );
}

function triggerWorldEvent() {
  const isLavaWorld = game.worldIndex === 3 || game.worldIndex === 5;
  const interval = game.boss ? 6 : Math.max(7, 11 - game.stage);
  if (isLavaWorld && game.piecesLocked % interval === 0) {
    addGarbageRow();
    showBanner("The floor rises!");
    tone(72, 0.35, "sawtooth", 0.05);
  }
}

function seedWorldTerrain() {
  if (game.worldIndex < 2) return;
  const shelfRows = game.worldIndex === 5 ? 2 : 1;
  for (let offset = 0; offset < shelfRows; offset += 1) {
    const row = BOARD_ROWS - 1 - offset;
    const holes = new Set([
      Math.floor(Math.random() * BOARD_COLUMNS),
      Math.floor(Math.random() * BOARD_COLUMNS),
      Math.floor(Math.random() * BOARD_COLUMNS),
    ]);
    for (let column = 0; column < BOARD_COLUMNS; column += 1) {
      if (!holes.has(column) && (column + offset) % 2 === 0) {
        board[row][column] = { type: "stone", color: "#59677d", crystal: false };
      }
    }
  }
}

/* --------------------------------------------------------------------------
 * Power-ups
 * ----------------------------------------------------------------------- */

function usePickaxe() {
  if (!canUsePower("pickaxe")) return;
  let target = null;
  for (let row = 0; row < BOARD_ROWS && !target; row += 1) {
    const candidates = board[row]
      .map((cell, column) => ({ cell, column }))
      .filter((entry) => entry.cell);
    if (candidates.length) target = candidates[Math.floor(Math.random() * candidates.length)];
    if (target) target.row = row;
  }
  if (!target) return;
  const crystal = board[target.row][target.column].crystal;
  board[target.row][target.column] = null;
  game.inventory.pickaxe -= 1;
  game.score += 120;
  if (crystal) collectCrystals(1);
  showBanner("Pickaxe strike");
  playSound("power");
  updateHUD();
  checkMissionComplete();
}

function useTnt() {
  if (!canUsePower("tnt")) return;
  const occupied = [];
  board.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell) occupied.push({ row: rowIndex, column: columnIndex });
    });
  });
  if (!occupied.length) return;
  occupied.sort((a, b) => b.row - a.row || Math.abs(a.column - 4.5) - Math.abs(b.column - 4.5));
  const center = occupied[0];
  let crystals = 0;
  for (let row = center.row - 1; row <= center.row + 1; row += 1) {
    for (let column = center.column - 1; column <= center.column + 1; column += 1) {
      if (board[row]?.[column]) {
        if (board[row][column].crystal) crystals += 1;
        board[row][column] = null;
      }
    }
  }
  game.inventory.tnt -= 1;
  game.score += 300;
  if (crystals) collectCrystals(crystals);
  showBanner("TNT blast!");
  playSound("power");
  updateHUD();
  checkMissionComplete();
}

function useDiamond() {
  if (!canUsePower("diamond")) return;
  game.inventory.diamond -= 1;
  game.slowUntil = performance.now() + 10000;
  showBanner("Time slowed: 10 seconds");
  playSound("crystal");
  updateHUD();
}

function unleashDragon() {
  if (!game.running || game.paused || game.dragon < 100) return;
  const occupiedRows = board
    .map((row, index) => ({ row, index }))
    .filter((entry) => entry.row.some(Boolean))
    .slice(-2)
    .map((entry) => entry.index);
  if (!occupiedRows.length) return;
  game.dragon = 0;
  const cleared = removeRows(occupiedRows);
  resolveClear(cleared, "dragon");
  showBanner("RON MODE — DRAGON WAVE!");
  playSound("power");
}

function canUsePower(name) {
  return game.running && !game.paused && game.inventory[name] > 0;
}

/* --------------------------------------------------------------------------
 * Missions and progression
 * ----------------------------------------------------------------------- */

function startLevel(levelIndex) {
  ensureAudio();
  hideModal();
  cancelAnimationFrame(animationFrame);
  const config = levelConfiguration(levelIndex);
  Object.assign(game, config, {
    levelIndex,
    levelLines: 0,
    levelCrystals: 0,
    score: 0,
    combo: -1,
    dragon: 0,
    piecesLocked: 0,
    running: true,
    paused: false,
    slowUntil: 0,
    startedAt: performance.now(),
    inventory: {
      pickaxe: 1 + (config.worldIndex >= 2 ? 1 : 0),
      tnt: config.worldIndex >= 2 ? 1 : 0,
      diamond: config.worldIndex >= 4 ? 1 : 0,
    },
  });

  board = createEmptyBoard();
  nextQueue = [];
  heldType = null;
  canHold = true;
  seedWorldTerrain();
  spawnPiece();
  menuScreen.hidden = true;
  gameScreen.hidden = false;
  document.body.dataset.world = String(game.worldIndex);
  document.body.classList.add("playing");
  window.scrollTo(0, 0);
  updateHUD();
  drawGame();
  playSound("power");
  announce(`${WORLDS[game.worldIndex].name}, mission ${game.stage}.`);
  lastFrameTime = performance.now();
  lastHudUpdate = lastFrameTime;
  dropAccumulator = 0;
  animationFrame = requestAnimationFrame(gameLoop);
}

function checkMissionComplete() {
  if (
    !game.running ||
    game.levelLines < game.targetLines ||
    game.levelCrystals < game.targetCrystals
  ) {
    return;
  }

  game.running = false;
  cancelAnimationFrame(animationFrame);
  const elapsedSeconds = Math.max(1, Math.round((performance.now() - game.startedAt) / 1000));
  const scoreBonus = Math.max(0, 3000 - elapsedSeconds * 10) + game.levelCrystals * 500;
  game.score += scoreBonus;
  save.highScore = Math.max(save.highScore, game.score);
  if (!save.completed.includes(game.levelIndex)) save.completed.push(game.levelIndex);
  save.maxUnlocked = Math.min(TOTAL_LEVELS - 1, Math.max(save.maxUnlocked, game.levelIndex + 1));
  persistSave();
  playSound("win");

  const finalMission = game.levelIndex === TOTAL_LEVELS - 1;
  showModal({
    icon: finalMission ? "R" : "◆",
    kicker: finalMission ? "Adventure complete" : "Mission complete",
    title: finalMission ? "The Dragon Core lives!" : "Crystal secured!",
    copy: finalMission
      ? "Ron restored every fragment and brought the Dragon Core home to Valbom. The worlds are open for replay."
      : `${WORLDS[game.worldIndex].missions[game.stage - 1]} is complete. The next portal is ready.`,
    stats: [
      ["Score", formatNumber(game.score)],
      ["Lines", game.levelLines],
      ["Time", formatTime(elapsedSeconds)],
    ],
    primaryLabel: finalMission ? "Replay finale" : "Next mission",
    primaryAction: () => startLevel(finalMission ? game.levelIndex : game.levelIndex + 1),
    secondaryLabel: "Mission map",
    secondaryAction: returnToMenu,
  });
}

function finishGameOver() {
  if (!game.running) return;
  game.running = false;
  cancelAnimationFrame(animationFrame);
  save.highScore = Math.max(save.highScore, game.score);
  persistSave();
  playSound("fail");
  showModal({
    icon: "!",
    kicker: "Portal interrupted",
    title: "The blocks reached the gate.",
    copy: "The crystal is still out there. Use your tools, watch the next piece and try the mission again.",
    stats: [
      ["Score", formatNumber(game.score)],
      ["Lines", `${game.levelLines}/${game.targetLines}`],
      ["Crystals", `${game.levelCrystals}/${game.targetCrystals}`],
    ],
    primaryLabel: "Retry mission",
    primaryAction: () => startLevel(game.levelIndex),
    secondaryLabel: "Mission map",
    secondaryAction: returnToMenu,
  });
}

function pauseGame(reason = "pause") {
  if (!game.running || game.paused) return;
  game.paused = true;
  const leaving = reason === "map";
  showModal({
    icon: leaving ? "←" : "Ⅱ",
    kicker: leaving ? "Leave mission?" : "Adventure paused",
    title: leaving ? "Return to the map?" : "The blocks are frozen.",
    copy: leaving
      ? "Current mission progress will restart when you return."
      : "Take a breath. The Dragon Core will wait here.",
    stats: [],
    primaryLabel: leaving ? "Keep playing" : "Resume",
    primaryAction: resumeGame,
    secondaryLabel: leaving ? "Leave mission" : "Restart mission",
    secondaryAction: leaving ? returnToMenu : () => startLevel(game.levelIndex),
  });
}

function resumeGame() {
  hideModal();
  game.paused = false;
  lastFrameTime = performance.now();
  animationFrame = requestAnimationFrame(gameLoop);
}

function returnToMenu() {
  cancelAnimationFrame(animationFrame);
  game.running = false;
  game.paused = false;
  hideModal();
  gameScreen.hidden = true;
  menuScreen.hidden = false;
  document.body.classList.remove("playing");
  document.body.dataset.world = "0";
  renderMenu();
  window.scrollTo(0, 0);
}

/* --------------------------------------------------------------------------
 * Drawing
 * ----------------------------------------------------------------------- */

function drawBlock(context, x, y, size, color, options = {}) {
  const { alpha = 1, crystal = false, ghost = false } = options;
  context.save();
  context.globalAlpha = alpha;
  if (ghost) {
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.strokeRect(x + 3, y + 3, size - 6, size - 6);
    context.restore();
    return;
  }

  context.fillStyle = color;
  context.fillRect(x + 1, y + 1, size - 2, size - 2);
  context.fillStyle = "rgba(255,255,255,.28)";
  context.fillRect(x + 3, y + 3, size - 6, Math.max(3, size * 0.16));
  context.fillRect(x + 3, y + 3, Math.max(3, size * 0.16), size - 6);
  context.fillStyle = "rgba(0,0,0,.24)";
  context.fillRect(x + 3, y + size - Math.max(5, size * 0.2), size - 6, Math.max(3, size * 0.12));
  context.fillRect(x + size - Math.max(5, size * 0.2), y + 3, Math.max(3, size * 0.12), size - 6);
  context.strokeStyle = "rgba(255,255,255,.5)";
  context.lineWidth = 1;
  context.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);

  if (crystal) {
    context.translate(x + size / 2, y + size / 2);
    context.rotate(Math.PI / 4);
    context.fillStyle = "#fff7a8";
    context.fillRect(-size * 0.17, -size * 0.17, size * 0.34, size * 0.34);
    context.strokeStyle = "#fff";
    context.lineWidth = 2;
    context.strokeRect(-size * 0.17, -size * 0.17, size * 0.34, size * 0.34);
  }
  context.restore();
}

function drawGame() {
  const context = gameContext;
  context.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  const gradient = context.createLinearGradient(0, 0, 0, gameCanvas.height);
  gradient.addColorStop(0, "#061638");
  gradient.addColorStop(1, "#020713");
  context.fillStyle = gradient;
  context.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

  context.strokeStyle = "rgba(142,201,255,.09)";
  context.lineWidth = 1;
  for (let column = 1; column < BOARD_COLUMNS; column += 1) {
    context.beginPath();
    context.moveTo(column * CELL_SIZE, 0);
    context.lineTo(column * CELL_SIZE, gameCanvas.height);
    context.stroke();
  }
  for (let row = 1; row < BOARD_ROWS; row += 1) {
    context.beginPath();
    context.moveTo(0, row * CELL_SIZE);
    context.lineTo(gameCanvas.width, row * CELL_SIZE);
    context.stroke();
  }

  board.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell) {
        drawBlock(
          context,
          columnIndex * CELL_SIZE,
          rowIndex * CELL_SIZE,
          CELL_SIZE,
          cell.color,
          { crystal: cell.crystal },
        );
      }
    });
  });

  if (activePiece && game.running) {
    let ghostRow = activePiece.row;
    while (!collides({ ...activePiece, row: ghostRow }, 1, 0)) ghostRow += 1;
    drawPiece(activePiece, ghostRow, true);
    drawPiece(activePiece, activePiece.row, false);
  }
}

function drawPiece(piece, rowPosition, ghost) {
  piece.matrix.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (!value || rowPosition + rowIndex < 0) return;
      drawBlock(
        gameContext,
        (piece.column + columnIndex) * CELL_SIZE,
        (rowPosition + rowIndex) * CELL_SIZE,
        CELL_SIZE,
        PIECES[piece.type].color,
        {
          ghost,
          alpha: ghost ? 0.45 : 1,
          crystal:
            !ghost &&
            piece.crystalCell?.[0] === rowIndex &&
            piece.crystalCell?.[1] === columnIndex,
        },
      );
    });
  });
}

function drawMiniPiece(context, canvas, type) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(0,0,0,.18)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (!type) return;
  const matrix = PIECES[type].matrix;
  const size = 20;
  const width = matrix[0].length * size;
  const height = matrix.length * size;
  const startX = (canvas.width - width) / 2;
  const startY = (canvas.height - height) / 2;
  matrix.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value) {
        drawBlock(
          context,
          startX + columnIndex * size,
          startY + rowIndex * size,
          size,
          PIECES[type].color,
        );
      }
    });
  });
}

function drawPreviews() {
  drawMiniPiece(nextContext, nextCanvas, nextQueue[0]);
  drawMiniPiece(holdContext, holdCanvas, heldType);
}

/* --------------------------------------------------------------------------
 * Rendering and overlays
 * ----------------------------------------------------------------------- */

function updateHUD() {
  const world = WORLDS[game.worldIndex];
  worldName.textContent = world.name;
  levelName.textContent = `${game.boss ? "Boss" : "Mission"} ${game.levelIndex + 1} · ${world.missions[game.stage - 1]}`;
  scoreValue.textContent = formatNumber(game.score);
  missionTitle.textContent = world.missions[game.stage - 1];
  missionCopy.textContent = game.boss
    ? "Boss mission: secure every target before the block storm closes the portal."
    : "Clear lines and recover the glowing crystal blocks to open the next portal.";
  worldEffect.textContent = world.effect;
  lineProgress.textContent = `${game.levelLines} / ${game.targetLines}`;
  crystalProgress.textContent = `${game.levelCrystals} / ${game.targetCrystals}`;
  lineMeter.style.width = `${Math.min(100, (game.levelLines / game.targetLines) * 100)}%`;
  crystalMeter.style.width = `${Math.min(100, (game.levelCrystals / game.targetCrystals) * 100)}%`;
  comboValue.textContent = `×${Math.max(0, game.combo + 1)}`;
  dragonValue.textContent = `${game.dragon}%`;
  dragonFill.style.width = `${game.dragon}%`;
  dragonButton.disabled = game.dragon < 100 || !game.running || game.paused;
  pickaxeCount.textContent = `×${game.inventory.pickaxe}`;
  tntCount.textContent = `×${game.inventory.tnt}`;
  diamondCount.textContent = `×${game.inventory.diamond}`;
  pickaxeButton.disabled = !canUsePower("pickaxe") || !board.flat().some(Boolean);
  tntButton.disabled = !canUsePower("tnt") || !board.flat().some(Boolean);
  diamondButton.disabled = !canUsePower("diamond") || game.slowUntil > performance.now();
  soundButton.textContent = save.sound ? "♪" : "×";
  soundButton.setAttribute("aria-label", save.sound ? "Turn sound off" : "Turn sound on");
  drawPreviews();
}

function renderMenu() {
  const completed = completedMissionCount();
  menuBestScore.textContent = formatNumber(save.highScore);
  menuCrystals.textContent = formatNumber(save.totalCrystals);
  menuMissions.textContent = `${completed} / ${TOTAL_LEVELS}`;
  continueButton.textContent = completed ? "Continue adventure" : "Start adventure";
  worldGrid.replaceChildren();

  WORLDS.forEach((world, worldIndex) => {
    const firstLevel = worldIndex * LEVELS_PER_WORLD;
    const worldUnlocked = firstLevel <= save.maxUnlocked;
    const card = document.createElement("article");
    card.className = `world-card${worldUnlocked ? "" : " locked"}`;
    card.style.setProperty("--card-color", world.color);
    card.dataset.number = String(worldIndex + 1).padStart(2, "0");
    card.innerHTML = `
      <span>World ${worldIndex + 1}</span>
      <h3>${world.name}</h3>
      <p>${world.summary}</p>
      <div class="mission-dots" aria-label="${world.name} missions"></div>
    `;

    const dots = card.querySelector(".mission-dots");
    for (let stage = 0; stage < LEVELS_PER_WORLD; stage += 1) {
      const levelIndex = firstLevel + stage;
      const unlocked = levelIndex <= save.maxUnlocked;
      const complete = save.completed.includes(levelIndex);
      const button = document.createElement("button");
      button.className = `mission-dot${unlocked ? " unlocked" : ""}${complete ? " complete" : ""}${stage === 4 ? " boss" : ""}`;
      button.type = "button";
      button.disabled = !unlocked;
      button.textContent = String(stage + 1);
      button.setAttribute(
        "aria-label",
        `${world.missions[stage]}${complete ? ", complete" : unlocked ? ", unlocked" : ", locked"}`,
      );
      if (unlocked) button.addEventListener("click", () => startLevel(levelIndex));
      dots.append(button);
    }
    worldGrid.append(card);
  });
}

function showBanner(message) {
  clearTimeout(bannerTimer);
  eventBanner.textContent = message;
  eventBanner.classList.remove("show");
  void eventBanner.offsetWidth;
  eventBanner.classList.add("show");
  bannerTimer = window.setTimeout(() => eventBanner.classList.remove("show"), 1350);
}

function showModal(options) {
  modalIcon.textContent = options.icon;
  modalKicker.textContent = options.kicker;
  modalTitle.textContent = options.title;
  modalCopy.textContent = options.copy;
  modalStats.replaceChildren();
  options.stats.forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "modal-stat";
    item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    modalStats.append(item);
  });
  modalStats.hidden = !options.stats.length;
  modalPrimary.textContent = options.primaryLabel;
  modalSecondary.textContent = options.secondaryLabel;
  primaryModalAction = options.primaryAction;
  secondaryModalAction = options.secondaryAction;
  gameModal.hidden = false;
  modalPrimary.focus();
}

function hideModal() {
  gameModal.hidden = true;
  primaryModalAction = null;
  secondaryModalAction = null;
}

function announce(message) {
  announcer.textContent = "";
  requestAnimationFrame(() => {
    announcer.textContent = message;
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/* --------------------------------------------------------------------------
 * Main animation loop
 * ----------------------------------------------------------------------- */

function currentDropInterval() {
  const base = levelConfiguration(game.levelIndex).dropInterval;
  return game.slowUntil > performance.now() ? base * 1.8 : base;
}

function gameLoop(time) {
  if (!game.running || game.paused) return;
  const elapsed = Math.min(60, time - lastFrameTime);
  lastFrameTime = time;
  dropAccumulator += elapsed;
  if (dropAccumulator >= currentDropInterval()) {
    if (!movePiece(0, 1)) lockPiece();
    dropAccumulator = 0;
  }
  drawGame();
  if (time - lastHudUpdate >= 120) {
    updateHUD();
    lastHudUpdate = time;
  }
  animationFrame = requestAnimationFrame(gameLoop);
}

/* --------------------------------------------------------------------------
 * Input
 * ----------------------------------------------------------------------- */

function runControl(control) {
  if (!game.running || game.paused) return;
  const actions = {
    left: () => movePiece(-1),
    right: () => movePiece(1),
    down: softDrop,
    rotate: rotatePiece,
    drop: hardDrop,
    hold: holdPiece,
  };
  actions[control]?.();
  drawGame();
  updateHUD();
}

document.addEventListener("keydown", (event) => {
  if (gameScreen.hidden) return;
  const key = event.key.toLowerCase();
  if (key === "p" || event.key === "Escape") {
    event.preventDefault();
    if (game.paused && !gameModal.hidden) resumeGame();
    else pauseGame();
    return;
  }
  if (!game.running || game.paused) return;
  const controlByKey = {
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right",
    arrowdown: "down",
    s: "down",
    arrowup: "rotate",
    w: "rotate",
    x: "rotate",
    z: "rotate",
    " ": "drop",
    c: "hold",
  };
  const control = controlByKey[key];
  if (control) {
    event.preventDefault();
    runControl(control);
  }
});

let repeatTimer = 0;
document.querySelectorAll("[data-control]").forEach((button) => {
  const control = button.dataset.control;
  const repeatable = ["left", "right", "down"].includes(control);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    runControl(control);
    if (repeatable) {
      clearInterval(repeatTimer);
      window.setTimeout(() => {
        if (button.matches(":active")) {
          repeatTimer = window.setInterval(() => runControl(control), 85);
        }
      }, 210);
    }
  });
});

addEventListener("pointerup", () => clearInterval(repeatTimer));
addEventListener("pointercancel", () => clearInterval(repeatTimer));

let gestureStart = null;
gameCanvas.addEventListener("pointerdown", (event) => {
  gestureStart = { x: event.clientX, y: event.clientY, time: performance.now() };
  gameCanvas.setPointerCapture?.(event.pointerId);
});

gameCanvas.addEventListener("pointerup", (event) => {
  if (!gestureStart) return;
  const deltaX = event.clientX - gestureStart.x;
  const deltaY = event.clientY - gestureStart.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance < 18) {
    rotatePiece();
  } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
    const moves = Math.max(1, Math.min(4, Math.round(Math.abs(deltaX) / 34)));
    for (let move = 0; move < moves; move += 1) movePiece(Math.sign(deltaX));
  } else if (deltaY > 65) {
    hardDrop();
  } else if (deltaY > 20) {
    softDrop();
  }
  gestureStart = null;
  drawGame();
  updateHUD();
});

/* --------------------------------------------------------------------------
 * Buttons and lifecycle
 * ----------------------------------------------------------------------- */

continueButton.addEventListener("click", () => startLevel(nextAdventureLevel()));

resetProgressButton.addEventListener("click", () => {
  if (!confirm("Reset Ron's saved missions, crystals and high score?")) return;
  save = defaultSave();
  persistSave();
  renderMenu();
});

mapButton.addEventListener("click", () => pauseGame("map"));
pauseButton.addEventListener("click", () => pauseGame());
soundButton.addEventListener("click", () => {
  save.sound = !save.sound;
  persistSave();
  if (save.sound) {
    ensureAudio();
    playSound("rotate");
  }
  updateHUD();
});

dragonButton.addEventListener("click", unleashDragon);
pickaxeButton.addEventListener("click", usePickaxe);
tntButton.addEventListener("click", useTnt);
diamondButton.addEventListener("click", useDiamond);
modalPrimary.addEventListener("click", () => primaryModalAction?.());
modalSecondary.addEventListener("click", () => secondaryModalAction?.());

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.running && !game.paused) pauseGame();
});

if ("serviceWorker" in navigator) {
  addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
      offlineBadge.textContent = "Ready offline";
      offlineBadge.classList.add("ready");
    } catch {
      offlineBadge.textContent = "Online play ready";
    }
  });
}

renderMenu();
drawGame();
