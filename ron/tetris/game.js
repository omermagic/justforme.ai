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

const DRAGON_STAGES = [
  { name: "Core egg", threshold: 0, waveRows: 2 },
  { name: "Cracking egg", threshold: 3, waveRows: 2 },
  { name: "Blue hatchling", threshold: 8, waveRows: 3 },
  { name: "Sky scout", threshold: 15, waveRows: 3 },
  { name: "Storm dragon", threshold: 24, waveRows: 4 },
  { name: "Core guardian", threshold: 36, waveRows: 4 },
];

const UPGRADE_CATALOG = {
  forge: {
    icon: "⛏",
    name: "Master pickaxe",
    description: "+1 pickaxe at the start of every mission.",
  },
  blast: {
    icon: "TNT",
    name: "Blast pack",
    description: "+1 TNT blast at the start of every mission.",
  },
  frost: {
    icon: "◆",
    name: "Time crystal",
    description: "+1 slow-time crystal at the start of every mission.",
  },
  fury: {
    icon: "⚡",
    name: "Dragon fury",
    description: "Dragon Power charges 12% faster.",
  },
  fortune: {
    icon: "✦",
    name: "Crystal sense",
    description: "Needed crystal blocks appear sooner.",
  },
  shield: {
    icon: "▣",
    name: "Guardian shield",
    description: "Block one extra boss attack each mission.",
  },
};

const BOSSES = [
  {
    name: "Gate Guardian",
    description: "The Guardian chains open spaces every seven pieces. Break through the gate.",
    status: "Gate chains",
    interval: 7,
  },
  {
    name: "Arena Champion",
    description: "Clear a line within every six pieces or the Champion sends a pressure row.",
    status: "Combo challenge",
    interval: 6,
  },
  {
    name: "Crystal Golem",
    description: "The Golem drops stone clusters every seven pieces. Save tools for its attacks.",
    status: "Stone fall",
    interval: 7,
  },
  {
    name: "Lava Titan",
    description: "The Titan raises the lava floor every five pieces. Keep the board low.",
    status: "Lava rising",
    interval: 5,
  },
  {
    name: "Cloud Serpent",
    description: "The Serpent blows every new piece two spaces, changing direction each time.",
    status: "Wind shifting",
    interval: 1,
  },
  {
    name: "Core Devourer",
    description: "The final boss cycles through chains, lava and violent sky wind.",
    status: "Chaos cycle",
    interval: 5,
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
const menuDragonName = document.getElementById("menu-dragon-name");
const menuDragonAvatar = document.getElementById("menu-dragon-avatar");
const dragonEvolutionName = document.getElementById("dragon-evolution-name");
const dragonEvolutionCopy = document.getElementById("dragon-evolution-copy");
const dragonEvolutionFill = document.getElementById("dragon-evolution-fill");
const offlineBadge = document.getElementById("offline-badge");

const gameCanvas = document.getElementById("game-canvas");
const gameContext = gameCanvas.getContext("2d");
const nextCanvas = document.getElementById("next-canvas");
const nextContext = nextCanvas.getContext("2d");
const boardFrame = document.getElementById("board-frame");
const eventBanner = document.getElementById("event-banner");
const bossStrip = document.getElementById("boss-strip");
const bossStripName = document.getElementById("boss-strip-name");

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
const bossIntel = document.getElementById("boss-intel");
const bossName = document.getElementById("boss-name");
const bossCountdown = document.getElementById("boss-countdown");
const dragonValue = document.getElementById("dragon-value");
const dragonFill = document.getElementById("dragon-fill");
const dragonButton = document.getElementById("dragon-button");
const dragonPowerLabel = document.getElementById("dragon-power-label");
const hudDragonName = document.getElementById("hud-dragon-name");
const hudShieldCount = document.getElementById("hud-shield-count");

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
const upgradeRewards = document.getElementById("upgrade-rewards");
const upgradeChoices = document.getElementById("upgrade-choices");
const modalActions = document.getElementById("modal-actions");
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
    rewardedLevels: [],
    upgrades: Object.fromEntries(Object.keys(UPGRADE_CATALOG).map((key) => [key, 0])),
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
      rewardedLevels: Array.isArray(stored?.rewardedLevels) ? stored.rewardedLevels : [],
      upgrades: {
        ...defaultSave().upgrades,
        ...(stored?.upgrades && typeof stored.upgrades === "object" ? stored.upgrades : {}),
      },
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

function dragonEvolution() {
  let stageIndex = 0;
  DRAGON_STAGES.forEach((stage, index) => {
    if (save.totalCrystals >= stage.threshold) stageIndex = index;
  });
  const stage = DRAGON_STAGES[stageIndex];
  const next = DRAGON_STAGES[stageIndex + 1] || null;
  const progress = next
    ? (save.totalCrystals - stage.threshold) / (next.threshold - stage.threshold)
    : 1;
  return { ...stage, stageIndex, next, progress: Math.max(0, Math.min(1, progress)) };
}

function upgradeRank(name) {
  return Math.max(0, Number(save.upgrades[name]) || 0);
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
  lastClearPiece: 0,
  bossAttackCount: 0,
  shieldCharges: 0,
  windBurst: 0,
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

function spawnPiece() {
  fillQueue();
  const type = nextQueue.shift();
  fillQueue();
  const matrix = cloneMatrix(PIECES[type].matrix);
  const crystalsStillNeeded = Math.max(
    0,
    game.targetCrystals - game.levelCrystals - countBoardCrystals(),
  );
  const fortuneRank = upgradeRank("fortune");
  const crystalCadence = fortuneRank >= 3 ? 1 : 2;
  const shouldCarryCrystal =
    crystalsStillNeeded > 0 &&
    (game.piecesLocked % crystalCadence === 0 || Math.random() < 0.42 + fortuneRank * 0.06);

  activePiece = {
    type,
    matrix,
    row: 0,
    column: Math.floor((BOARD_COLUMNS - matrix[0].length) / 2),
    crystalCell: shouldCarryCrystal ? chooseCrystalCell(matrix) : null,
  };

  if ((game.worldIndex === 4 || game.worldIndex === 5) && game.piecesLocked > 0) {
    const serpentWind = game.boss && game.worldIndex === 4;
    const finalWind = game.boss && game.worldIndex === 5 && game.windBurst > 0;
    const direction = serpentWind
      ? game.piecesLocked % 2 === 0
        ? -1
        : 1
      : Math.random() < 0.5
        ? -1
        : 1;
    const strength = serpentWind || finalWind ? 2 : 1;
    for (let step = 0; step < strength; step += 1) {
      if (!collides(activePiece, 0, direction)) activePiece.column += direction;
    }
    if (finalWind) game.windBurst -= 1;
    showBanner(
      strength > 1
        ? direction < 0
          ? "Serpent storm ⇐"
          : "Serpent storm ⇒"
        : direction < 0
          ? "Sky wind ←"
          : "Sky wind →",
    );
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

function softDropRows(requestedRows) {
  if (!game.running || game.paused || !activePiece) return 0;
  const rows = Math.max(1, Math.floor(requestedRows));
  let movedRows = 0;

  while (movedRows < rows && movePiece(0, 1)) {
    movedRows += 1;
  }

  if (movedRows > 0) {
    game.score += movedRows;
    dropAccumulator = 0;
  }

  // A swipe boost never locks the piece. This leaves time for a sideways
  // swipe into an opening, even when the piece reaches the stack.
  return movedRows;
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
    game.lastClearPiece = game.piecesLocked;
    game.levelLines += count;
    const lineScores = [0, 100, 300, 500, 800];
    const comboBonus = game.combo > 0 ? game.combo * 75 : 0;
    game.score += (lineScores[Math.min(count, 4)] + comboBonus) * (game.levelIndex + 1);
    const arenaMultiplier = game.worldIndex === 1 ? 1.5 : 1;
    const furyMultiplier = 1 + upgradeRank("fury") * 0.12;
    game.dragon = Math.min(
      100,
      game.dragon +
        Math.round((count * 18 + game.combo * 7) * arenaMultiplier * furyMultiplier),
    );
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
  const previousEvolution = dragonEvolution();
  for (let index = 0; index < amount; index += 1) {
    game.levelCrystals += 1;
    save.totalCrystals += 1;
    const rewardCycle = save.totalCrystals % 3;
    if (rewardCycle === 1) game.inventory.pickaxe += 1;
    if (rewardCycle === 2) game.inventory.tnt += 1;
    if (rewardCycle === 0) game.inventory.diamond += 1;
  }
  persistSave();
  const currentEvolution = dragonEvolution();
  if (currentEvolution.stageIndex > previousEvolution.stageIndex) {
    showBanner(`${currentEvolution.name} unlocked!`);
    playSound("win");
  } else {
    showBanner(amount > 1 ? `${amount} crystals recovered` : "Crystal recovered");
    playSound("crystal");
  }
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

function bossAttackBlocked(attackName) {
  if (game.shieldCharges <= 0) return false;
  game.shieldCharges -= 1;
  showBanner(`Shield blocked ${attackName}`);
  tone(720, 0.16, "square", 0.04);
  tone(980, 0.18, "sine", 0.03, 0.08);
  updateHUD();
  return true;
}

function dropBossBlocks(count, color, type) {
  const columns = Array.from({ length: BOARD_COLUMNS }, (_, index) => index);
  for (let index = columns.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [columns[index], columns[swapIndex]] = [columns[swapIndex], columns[index]];
  }

  let placed = 0;
  columns.some((column) => {
    let row = BOARD_ROWS - 1;
    while (row >= 0 && board[row][column]) row -= 1;
    if (row >= 2) {
      board[row][column] = { type, color, crystal: false };
      placed += 1;
    }
    return placed >= count;
  });
}

function triggerBossEvent() {
  const boss = BOSSES[game.worldIndex];

  if (game.worldIndex === 0 && game.piecesLocked % boss.interval === 0) {
    if (bossAttackBlocked("gate chains")) return;
    dropBossBlocks(4, "#d34263", "chain");
    showBanner("Gate chains locked in!");
    tone(86, 0.3, "sawtooth", 0.045);
  }

  if (
    game.worldIndex === 1 &&
    game.piecesLocked - game.lastClearPiece >= boss.interval
  ) {
    game.lastClearPiece = game.piecesLocked;
    if (bossAttackBlocked("arena pressure")) return;
    addGarbageRow();
    showBanner("Champion pressure row!");
    tone(92, 0.32, "square", 0.045);
  }

  if (game.worldIndex === 2 && game.piecesLocked % boss.interval === 0) {
    if (bossAttackBlocked("golem stones")) return;
    dropBossBlocks(5, "#778398", "golem");
    showBanner("Golem stonefall!");
    tone(62, 0.4, "triangle", 0.055);
  }

  if (game.worldIndex === 3 && game.piecesLocked % boss.interval === 0) {
    if (bossAttackBlocked("rising lava")) return;
    addGarbageRow();
    showBanner("Lava Titan rises!");
    tone(68, 0.42, "sawtooth", 0.055);
  }

  if (game.worldIndex === 4 && game.piecesLocked % 5 === 0) {
    showBanner(game.piecesLocked % 2 === 0 ? "Serpent turns west!" : "Serpent turns east!");
  }

  if (game.worldIndex === 5 && game.piecesLocked % boss.interval === 0) {
    const attackIndex = game.bossAttackCount % 3;
    game.bossAttackCount += 1;
    if (attackIndex === 0) {
      if (bossAttackBlocked("citadel chains")) return;
      dropBossBlocks(4, "#8d4fe8", "rune");
      showBanner("Devourer: rune chains!");
    } else if (attackIndex === 1) {
      if (bossAttackBlocked("citadel lava")) return;
      addGarbageRow();
      showBanner("Devourer: lava surge!");
    } else {
      if (bossAttackBlocked("citadel storm")) return;
      game.windBurst = 3;
      showBanner("Devourer: storm armed!");
    }
    tone(72, 0.4, "sawtooth", 0.055);
  }
}

function triggerWorldEvent() {
  if (game.boss) {
    triggerBossEvent();
    return;
  }
  const isLavaWorld = game.worldIndex === 3 || game.worldIndex === 5;
  const interval = Math.max(7, 11 - game.stage);
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
  const evolution = dragonEvolution();
  const occupiedRows = board
    .map((row, index) => ({ row, index }))
    .filter((entry) => entry.row.some(Boolean))
    .slice(-evolution.waveRows)
    .map((entry) => entry.index);
  if (!occupiedRows.length) return;
  game.dragon = 0;
  const cleared = removeRows(occupiedRows);
  resolveClear(cleared, "dragon");
  showBanner(`DRAGON MODE — ${evolution.waveRows}-ROW WAVE!`);
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
    lastClearPiece: 0,
    bossAttackCount: 0,
    shieldCharges: upgradeRank("shield"),
    windBurst: 0,
    running: true,
    paused: false,
    slowUntil: 0,
    startedAt: performance.now(),
    inventory: {
      pickaxe: 1 + (config.worldIndex >= 2 ? 1 : 0) + upgradeRank("forge"),
      tnt: (config.worldIndex >= 2 ? 1 : 0) + upgradeRank("blast"),
      diamond: (config.worldIndex >= 4 ? 1 : 0) + upgradeRank("frost"),
    },
  });

  board = createEmptyBoard();
  nextQueue = [];
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
  if (config.boss) showBanner(`${BOSSES[config.worldIndex].name} awakens!`);
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
  const completion = { finalMission, elapsedSeconds };
  if (!save.rewardedLevels.includes(game.levelIndex)) {
    showUpgradeReward(completion);
  } else {
    showCompletionModal(completion);
  }
}

function chooseUpgradeOptions() {
  const keys = Object.keys(UPGRADE_CATALOG);
  for (let index = keys.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [keys[index], keys[swapIndex]] = [keys[swapIndex], keys[index]];
  }
  return keys.slice(0, 3);
}

function showUpgradeReward(completion) {
  showModal({
    icon: game.boss ? "♛" : "◆",
    kicker: game.boss ? "Boss defeated" : "Mission complete",
    title: "Choose your reward",
    copy: `${WORLDS[game.worldIndex].missions[game.stage - 1]} is secure. Pick one upgrade—it stays with the dragon for every future mission.`,
    stats: [
      ["Score", formatNumber(game.score)],
      ["Lines", game.levelLines],
      ["Time", formatTime(completion.elapsedSeconds)],
    ],
    primaryLabel: "Next mission",
    primaryAction: () => {},
    secondaryLabel: "Mission map",
    secondaryAction: returnToMenu,
  });

  modalActions.hidden = true;
  upgradeRewards.hidden = false;
  gameModal.querySelector(".modal-card").classList.add("reward-mode");
  upgradeChoices.replaceChildren();

  chooseUpgradeOptions().forEach((upgradeKey) => {
    const upgrade = UPGRADE_CATALOG[upgradeKey];
    const button = document.createElement("button");
    button.className = "upgrade-choice";
    button.type = "button";
    button.innerHTML = `
      <span aria-hidden="true">${upgrade.icon}</span>
      <strong>${upgrade.name}</strong>
      <small>${upgrade.description}</small>
      <em>Rank ${upgradeRank(upgradeKey)} → ${upgradeRank(upgradeKey) + 1}</em>
    `;
    button.addEventListener("click", () => claimUpgrade(upgradeKey, completion));
    upgradeChoices.append(button);
  });

  upgradeChoices.querySelector("button")?.focus();
}

function claimUpgrade(upgradeKey, completion) {
  save.upgrades[upgradeKey] = upgradeRank(upgradeKey) + 1;
  if (!save.rewardedLevels.includes(game.levelIndex)) save.rewardedLevels.push(game.levelIndex);
  persistSave();
  playSound("power");
  showCompletionModal(completion, UPGRADE_CATALOG[upgradeKey]);
}

function showCompletionModal(completion, reward = null) {
  const { finalMission, elapsedSeconds } = completion;
  showModal({
    icon: finalMission ? "R" : "◆",
    kicker: reward ? "Permanent upgrade secured" : finalMission ? "Adventure complete" : "Mission complete",
    title: reward
      ? `${reward.name} upgraded!`
      : finalMission
        ? "The Dragon Core lives!"
        : "Crystal secured!",
    copy: finalMission
      ? "You restored every fragment and brought the Dragon Core home to Valbom. The worlds are open for replay."
      : reward
        ? `${reward.description} The next portal is ready.`
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
}

/* --------------------------------------------------------------------------
 * Rendering and overlays
 * ----------------------------------------------------------------------- */

function bossStatusMessage() {
  const boss = BOSSES[game.worldIndex];
  if (game.worldIndex === 4) {
    return game.piecesLocked % 2 === 0 ? "Next wind: east ⇒" : "Next wind: west ⇐";
  }
  const progress =
    game.worldIndex === 1
      ? game.piecesLocked - game.lastClearPiece
      : game.piecesLocked % boss.interval;
  const remaining = Math.max(1, boss.interval - progress);
  return `${boss.status} in ${remaining} ${remaining === 1 ? "piece" : "pieces"}`;
}

function updateHUD() {
  const world = WORLDS[game.worldIndex];
  const evolution = dragonEvolution();
  const boss = BOSSES[game.worldIndex];
  worldName.textContent = world.name;
  levelName.textContent = `${game.boss ? "Boss" : "Mission"} ${game.levelIndex + 1} · ${world.missions[game.stage - 1]}`;
  scoreValue.textContent = formatNumber(game.score);
  missionTitle.textContent = world.missions[game.stage - 1];
  missionCopy.textContent = game.boss
    ? boss.description
    : "Clear lines and recover the glowing crystal blocks to open the next portal.";
  worldEffect.textContent = world.effect;
  bossIntel.hidden = !game.boss;
  bossStrip.hidden = !game.boss;
  if (game.boss) {
    bossName.textContent = boss.name;
    bossStripName.textContent = boss.name;
    bossCountdown.textContent = bossStatusMessage();
  }
  lineProgress.textContent = `${game.levelLines} / ${game.targetLines}`;
  crystalProgress.textContent = `${game.levelCrystals} / ${game.targetCrystals}`;
  lineMeter.style.width = `${Math.min(100, (game.levelLines / game.targetLines) * 100)}%`;
  crystalMeter.style.width = `${Math.min(100, (game.levelCrystals / game.targetCrystals) * 100)}%`;
  comboValue.textContent = `×${Math.max(0, game.combo + 1)}`;
  dragonPowerLabel.textContent = `${evolution.name} power`;
  dragonValue.textContent = `${game.dragon}%`;
  dragonFill.style.width = `${game.dragon}%`;
  dragonButton.disabled = game.dragon < 100 || !game.running || game.paused;
  pickaxeCount.textContent = `×${game.inventory.pickaxe}`;
  tntCount.textContent = `×${game.inventory.tnt}`;
  diamondCount.textContent = `×${game.inventory.diamond}`;
  hudDragonName.textContent = evolution.name;
  hudShieldCount.textContent = game.shieldCharges
    ? `${game.shieldCharges} boss ${game.shieldCharges === 1 ? "shield" : "shields"}`
    : "No shield";
  pickaxeButton.disabled = !canUsePower("pickaxe") || !board.flat().some(Boolean);
  tntButton.disabled = !canUsePower("tnt") || !board.flat().some(Boolean);
  diamondButton.disabled = !canUsePower("diamond") || game.slowUntil > performance.now();
  soundButton.textContent = save.sound ? "♪" : "×";
  soundButton.setAttribute("aria-label", save.sound ? "Turn sound off" : "Turn sound on");
  drawPreviews();
}

function renderMenu() {
  const completed = completedMissionCount();
  const evolution = dragonEvolution();
  menuBestScore.textContent = formatNumber(save.highScore);
  menuCrystals.textContent = formatNumber(save.totalCrystals);
  menuMissions.textContent = `${completed} / ${TOTAL_LEVELS}`;
  menuDragonName.textContent = evolution.name;
  menuDragonAvatar.dataset.stage = String(evolution.stageIndex);
  menuDragonAvatar.setAttribute("aria-label", evolution.name);
  dragonEvolutionName.textContent = evolution.name;
  dragonEvolutionFill.style.width = `${evolution.progress * 100}%`;
  dragonEvolutionCopy.textContent = evolution.next
    ? `Collect ${evolution.next.threshold - save.totalCrystals} more ${evolution.next.threshold - save.totalCrystals === 1 ? "crystal" : "crystals"} to evolve`
    : "Maximum evolution unlocked";
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
  upgradeRewards.hidden = true;
  modalActions.hidden = false;
  gameModal.querySelector(".modal-card").classList.remove("reward-mode");
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
  upgradeRewards.hidden = true;
  modalActions.hidden = false;
  gameModal.querySelector(".modal-card").classList.remove("reward-mode");
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
  };
  const control = controlByKey[key];
  if (control) {
    event.preventDefault();
    runControl(control);
  }
});

let gestureStart = null;

function clearGesture(pointerId = null) {
  if (pointerId !== null && gestureStart?.pointerId !== pointerId) return;
  gestureStart = null;
}

gameCanvas.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary) return;
  event.preventDefault();
  clearGesture();
  gestureStart = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    startTime: performance.now(),
  };
  gameCanvas.setPointerCapture?.(event.pointerId);
});

gameCanvas.addEventListener("pointermove", (event) => {
  if (gestureStart?.pointerId !== event.pointerId) return;
  event.preventDefault();
  gestureStart.lastX = event.clientX;
  gestureStart.lastY = event.clientY;
});

gameCanvas.addEventListener("pointerup", (event) => {
  if (gestureStart?.pointerId !== event.pointerId) return;
  event.preventDefault();
  gestureStart.lastX = event.clientX;
  gestureStart.lastY = event.clientY;

  const deltaX = gestureStart.lastX - gestureStart.startX;
  const deltaY = gestureStart.lastY - gestureStart.startY;
  const horizontalDistance = Math.abs(deltaX);
  const verticalDistance = Math.abs(deltaY);
  const elapsed = Math.max(1, performance.now() - gestureStart.startTime);
  const downwardSpeed = deltaY / elapsed;
  const minimumSwipe = 12;

  if (horizontalDistance >= minimumSwipe && horizontalDistance >= verticalDistance) {
    const moves = Math.max(1, Math.min(5, Math.round(horizontalDistance / 28)));
    for (let move = 0; move < moves; move += 1) movePiece(Math.sign(deltaX));
  } else if (deltaY <= -minimumSwipe) {
    rotatePiece();
  } else if (deltaY >= minimumSwipe) {
    const isFullDrop = deltaY >= 130 || (deltaY >= 82 && downwardSpeed >= 0.85);
    if (isFullDrop) {
      hardDrop();
    } else {
      const rows = Math.max(2, Math.min(8, Math.round(deltaY / 16)));
      softDropRows(rows);
    }
  }

  clearGesture(event.pointerId);
  drawGame();
  updateHUD();
});

gameCanvas.addEventListener("pointercancel", (event) => {
  clearGesture(event.pointerId);
});

gameCanvas.addEventListener("lostpointercapture", (event) => {
  clearGesture(event.pointerId);
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
  if (document.hidden) clearGesture();
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
