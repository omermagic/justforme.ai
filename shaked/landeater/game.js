"use strict";

/* --------------------------------------------------------------------------
 * Configuration
 * ----------------------------------------------------------------------- */

const COLS = 30;
const ROWS = 46;
const BORDER = 2;
const EMPTY = 0;
const LAND = 1;
const TRAIL = 2;
const SAVE_KEY = "shaked_landeater_save_v1";

const DIRECTIONS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

const WORLDS = [
  {
    name: "Strawberry Meadow",
    empty: "#160d2b",
    emptyGlow: "#342050",
    land: "#ff87b7",
    landAlt: "#ffc3dc",
    accent: "#ffd84d",
    surprise: "Strawberry sparkle unlocked!",
  },
  {
    name: "Candy Cloud",
    empty: "#161f46",
    emptyGlow: "#364d82",
    land: "#a6ddff",
    landAlt: "#e6f6ff",
    accent: "#ff78ae",
    surprise: "A rainbow cloud joins the journey!",
  },
  {
    name: "Moonlight Café",
    empty: "#211438",
    emptyGlow: "#553368",
    land: "#d0adff",
    landAlt: "#f0e4ff",
    accent: "#ffe073",
    surprise: "The moon café is open!",
  },
  {
    name: "Ocean Picnic",
    empty: "#092c42",
    emptyGlow: "#175c70",
    land: "#65ddca",
    landAlt: "#c2fff4",
    accent: "#ff719f",
    surprise: "A pearl shield is waiting!",
  },
  {
    name: "Golden Star Park",
    empty: "#34200d",
    emptyGlow: "#6f4e20",
    land: "#ffd45a",
    landAlt: "#fff0ad",
    accent: "#ff5f9e",
    surprise: "Golden score mode discovered!",
  },
  {
    name: "Dream Castle",
    empty: "#210d35",
    emptyGlow: "#56216b",
    land: "#ff72b1",
    landAlt: "#ffd4e8",
    accent: "#70efd3",
    surprise: "The Dream Castle lights up!",
  },
];

/* --------------------------------------------------------------------------
 * DOM
 * ----------------------------------------------------------------------- */

const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const startButton = document.getElementById("start-button");
const resetButton = document.getElementById("reset-button");
const offlineBadge = document.getElementById("offline-badge");
const menuBestScore = document.getElementById("menu-best-score");
const menuBestLevel = document.getElementById("menu-best-level");
const menuTotalLand = document.getElementById("menu-total-land");

const homeButton = document.getElementById("home-button");
const soundButton = document.getElementById("sound-button");
const pauseButton = document.getElementById("pause-button");
const worldName = document.getElementById("world-name");
const levelLabel = document.getElementById("level-label");
const scoreValue = document.getElementById("score-value");
const livesValue = document.getElementById("lives");
const landValue = document.getElementById("land-value");
const targetValue = document.getElementById("target-value");
const landFill = document.getElementById("land-fill");
const comboValue = document.getElementById("combo-value");
const feverFill = document.getElementById("fever-fill");
const feverValue = document.getElementById("fever-value");
const boardWrap = document.getElementById("board-wrap");
const gameCanvas = document.getElementById("game-canvas");
const context = gameCanvas.getContext("2d");
const eventBanner = document.getElementById("event-banner");
const readyMessage = document.getElementById("ready-message");
const announcer = document.getElementById("announcer");

const gameModal = document.getElementById("game-modal");
const modalSticker = document.getElementById("modal-sticker");
const modalKicker = document.getElementById("modal-kicker");
const modalTitle = document.getElementById("modal-title");
const modalCopy = document.getElementById("modal-copy");
const modalStats = document.getElementById("modal-stats");
const modalPrimary = document.getElementById("modal-primary");
const modalSecondary = document.getElementById("modal-secondary");

/* --------------------------------------------------------------------------
 * Save data
 * ----------------------------------------------------------------------- */

function defaultSave() {
  return {
    bestScore: 0,
    highestLevel: 1,
    totalLand: 0,
    gamesPlayed: 0,
    sound: true,
  };
}

function loadSave() {
  try {
    return { ...defaultSave(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") };
  } catch {
    return defaultSave();
  }
}

let save = loadSave();

function persistSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function storeRunProgress() {
  save.bestScore = Math.max(save.bestScore, game.score || 0);
  persistSave();
}

function updateMenu() {
  menuBestScore.textContent = save.bestScore.toLocaleString();
  menuBestLevel.textContent = String(save.highestLevel);
  menuTotalLand.textContent = `${Math.floor(save.totalLand).toLocaleString()}%`;
  startButton.textContent = save.highestLevel > 1 ? `Continue at level ${save.highestLevel}` : "Start adventure";
}

/* --------------------------------------------------------------------------
 * Sound
 * ----------------------------------------------------------------------- */

let audioContext = null;
let soundEnabled = save.sound !== false;

function ensureAudio() {
  if (!soundEnabled) return null;
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioContext = new AudioContextClass();
  }
  if (audioContext?.state === "suspended") audioContext.resume();
  return audioContext;
}

function tone(frequency, duration = 0.08, type = "sine", volume = 0.035, delay = 0) {
  const audio = ensureAudio();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const start = audio.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playSound(name) {
  if (!soundEnabled) return;
  const sounds = {
    start: () => [523, 659, 784, 1047].forEach((note, index) => tone(note, 0.14, "triangle", 0.04, index * 0.08)),
    turn: () => tone(470, 0.035, "sine", 0.018),
    claim: () => [620, 780, 980].forEach((note, index) => tone(note, 0.12, "triangle", 0.035, index * 0.045)),
    bonus: () => [880, 1175, 1397].forEach((note, index) => tone(note, 0.16, "sine", 0.04, index * 0.06)),
    fever: () => [523, 659, 784, 1047, 1319].forEach((note, index) => tone(note, 0.18, "square", 0.025, index * 0.07)),
    hit: () => [220, 170, 120].forEach((note, index) => tone(note, 0.18, "sawtooth", 0.04, index * 0.06)),
    win: () => [523, 659, 784, 1047, 784, 1175].forEach((note, index) => tone(note, 0.2, "triangle", 0.045, index * 0.08)),
  };
  sounds[name]?.();
}

function haptic(pattern = 12) {
  navigator.vibrate?.(pattern);
}

function updateSoundButton() {
  soundButton.textContent = soundEnabled ? "♪" : "×";
  soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
}

/* --------------------------------------------------------------------------
 * Game state
 * ----------------------------------------------------------------------- */

let board = [];
let enemies = [];
let pickups = [];
let viewWidth = 600;
let viewHeight = 920;
let animationFrame = 0;
let lastFrame = performance.now();
let bannerTimer = 0;
let modalPrimaryAction = null;
let modalSecondaryAction = null;

const player = {
  x: Math.floor(COLS / 2),
  y: 1,
  direction: null,
  trail: [],
};

const game = {
  running: false,
  paused: false,
  resolving: false,
  level: 1,
  score: 0,
  levelStartScore: 0,
  lives: 3,
  captured: 0,
  target: 75,
  combo: 0,
  fever: 0,
  feverUntil: 0,
  shield: 0,
  slowUntil: 0,
  lastPlayerMove: 0,
  nextPickupAt: 0,
};

function currentWorld() {
  return WORLDS[(game.level - 1) % WORLDS.length];
}

function createBoard() {
  board = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, column) =>
      row < BORDER || row >= ROWS - BORDER || column < BORDER || column >= COLS - BORDER
        ? LAND
        : EMPTY,
    ),
  );
}

function resetPlayer() {
  player.x = Math.floor(COLS / 2);
  player.y = 1;
  player.direction = null;
  player.trail = [];
  readyMessage.classList.remove("dismissed");
}

function isInside(column, row) {
  return column >= 0 && column < COLS && row >= 0 && row < ROWS;
}

function randomEmptyCell(minDistance = 0) {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const x = BORDER + Math.floor(Math.random() * (COLS - BORDER * 2));
    const y = BORDER + Math.floor(Math.random() * (ROWS - BORDER * 2));
    if (board[y][x] !== EMPTY) continue;
    if (Math.hypot(x - player.x, y - player.y) < minDistance) continue;
    if (enemies.some((enemy) => Math.hypot(x - enemy.x, y - enemy.y) < 2.5)) continue;
    return { x, y };
  }
  return { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) };
}

function spawnEnemies() {
  enemies = [];
  const count = Math.min(8, 2 + Math.floor((game.level - 1) / 2));
  const baseSpeed = Math.min(4.8, 2.35 + game.level * 0.13);

  for (let index = 0; index < count; index += 1) {
    const cell = randomEmptyCell(10);
    const angle = Math.random() * Math.PI * 2;
    const speed = baseSpeed * (0.88 + Math.random() * 0.25);
    enemies.push({
      x: cell.x + 0.5,
      y: cell.y + 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      type: game.level >= 3 && index === count - 1 && game.level % 3 === 0 ? "chaser" : "puff",
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function spawnPickup(forceType = null) {
  if (!game.running || pickups.length >= 2) return;
  const cell = randomEmptyCell(6);
  const roll = Math.random();
  const type = forceType || (roll < 0.46 ? "strawberry" : roll < 0.74 ? "shield" : "slow");
  pickups.push({ ...cell, type, expiresAt: performance.now() + 11000, phase: Math.random() * 6 });
}

function prepareLevel(level, keepScore = false) {
  game.level = Math.max(1, level);
  if (!keepScore) game.score = 0;
  game.levelStartScore = game.score;
  game.lives = 3;
  game.captured = 0;
  game.target = Math.min(81, 75 + Math.floor((game.level - 1) / 3));
  game.combo = 0;
  game.fever = 0;
  game.feverUntil = 0;
  game.shield = 0;
  game.slowUntil = 0;
  game.running = true;
  game.paused = false;
  game.resolving = false;
  game.lastPlayerMove = performance.now();
  game.nextPickupAt = performance.now() + 6500;

  createBoard();
  resetPlayer();
  spawnEnemies();
  pickups = [];
  if (game.level === 1) spawnPickup("strawberry");

  worldName.textContent = currentWorld().name;
  levelLabel.textContent = `Level ${game.level}`;
  targetValue.textContent = String(game.target);
  hideModal();
  updateHUD();
  announce(`${currentWorld().name}, level ${game.level}. Swipe to begin.`);
  playSound("start");
}

function startAdventure() {
  ensureAudio();
  menuScreen.hidden = true;
  gameScreen.hidden = false;
  document.body.classList.add("playing");
  prepareLevel(save.highestLevel, false);
  requestAnimationFrame(resizeCanvas);
}

function showMenu() {
  storeRunProgress();
  game.running = false;
  game.paused = false;
  gameScreen.hidden = true;
  menuScreen.hidden = false;
  document.body.classList.remove("playing");
  hideModal();
  updateMenu();
  scrollTo({ top: 0, behavior: "instant" });
}

/* --------------------------------------------------------------------------
 * Territory logic
 * ----------------------------------------------------------------------- */

function interiorLandCount() {
  let count = 0;
  for (let row = BORDER; row < ROWS - BORDER; row += 1) {
    for (let column = BORDER; column < COLS - BORDER; column += 1) {
      if (board[row][column] === LAND) count += 1;
    }
  }
  return count;
}

function collectPickup(pickup, automatically = false) {
  if (pickup.type === "strawberry") {
    const points = game.feverUntil > performance.now() ? 1600 : 800;
    game.score += points;
    showBanner(`Strawberry +${points.toLocaleString()}`);
  } else if (pickup.type === "shield") {
    game.shield = Math.min(2, game.shield + 1);
    showBanner("Bow shield ready!");
  } else {
    game.slowUntil = performance.now() + 8000;
    showBanner("Milk time: shadows slowed!");
  }
  if (!automatically) game.fever = Math.min(100, game.fever + 8);
  playSound("bonus");
  haptic(18);
}

function claimTerritory() {
  if (!player.trail.length) return;
  const before = interiorLandCount();

  player.trail.forEach(({ x, y }) => {
    board[y][x] = LAND;
  });

  const reachable = new Uint8Array(COLS * ROWS);
  const queue = [];
  let queueIndex = 0;

  function enqueue(x, y) {
    if (!isInside(x, y) || board[y][x] !== EMPTY) return;
    const index = y * COLS + x;
    if (reachable[index]) return;
    reachable[index] = 1;
    queue.push({ x, y });
  }

  enemies.forEach((enemy) => enqueue(Math.floor(enemy.x), Math.floor(enemy.y)));

  while (queueIndex < queue.length) {
    const cell = queue[queueIndex++];
    enqueue(cell.x - 1, cell.y);
    enqueue(cell.x + 1, cell.y);
    enqueue(cell.x, cell.y - 1);
    enqueue(cell.x, cell.y + 1);
  }

  for (let row = BORDER; row < ROWS - BORDER; row += 1) {
    for (let column = BORDER; column < COLS - BORDER; column += 1) {
      if (board[row][column] === EMPTY && !reachable[row * COLS + column]) {
        board[row][column] = LAND;
      }
    }
  }

  const claimedPickups = pickups.filter((pickup) => board[pickup.y]?.[pickup.x] === LAND);
  pickups = pickups.filter((pickup) => board[pickup.y]?.[pickup.x] !== LAND);
  claimedPickups.forEach((pickup) => collectPickup(pickup, true));

  const after = interiorLandCount();
  const interiorCells = (COLS - BORDER * 2) * (ROWS - BORDER * 2);
  const newlyClaimed = Math.max(0, after - before);
  const bitePercent = (newlyClaimed / interiorCells) * 100;
  game.captured = (after / interiorCells) * 100;
  game.combo = bitePercent >= 3.5 ? Math.min(8, game.combo + 1) : Math.max(0, game.combo - 1);

  const comboMultiplier = 1 + game.combo * 0.3;
  const feverMultiplier = game.feverUntil > performance.now() ? 2 : 1;
  const points = Math.round(newlyClaimed * 6 * comboMultiplier * feverMultiplier);
  game.score += points;
  game.fever = Math.min(100, game.fever + Math.max(6, bitePercent * 2.7));
  player.trail = [];

  if (bitePercent >= 12) showBanner(`Huge bite! +${points.toLocaleString()}`);
  else if (game.combo >= 2) showBanner(`Sweet combo ×${game.combo + 1}`);
  else showBanner(`Garden +${bitePercent.toFixed(1)}%`);
  playSound("claim");
  haptic(bitePercent >= 12 ? [20, 25, 35] : 14);

  if (game.fever >= 100 && game.feverUntil <= performance.now()) activateFever();
  if (game.captured >= game.target) completeLevel();
}

function activateFever() {
  game.fever = 0;
  game.feverUntil = performance.now() + 8000;
  showBanner("♥ CUTE FEVER ×2 ♥");
  playSound("fever");
  announce("Cute Fever! Double score and slower shadows for eight seconds.");
}

function movePlayer() {
  if (!player.direction || game.resolving) return;
  const direction = DIRECTIONS[player.direction];
  const nextX = player.x + direction.x;
  const nextY = player.y + direction.y;

  if (!isInside(nextX, nextY)) {
    player.direction = null;
    return;
  }

  const nextCell = board[nextY][nextX];
  if (nextCell === TRAIL) {
    loseLife("Your ribbon crossed itself!");
    return;
  }

  player.x = nextX;
  player.y = nextY;

  if (nextCell === EMPTY) {
    board[nextY][nextX] = TRAIL;
    player.trail.push({ x: nextX, y: nextY });
  } else if (nextCell === LAND && player.trail.length) {
    player.direction = null;
    claimTerritory();
  }

  const pickup = pickups.find((item) => item.x === player.x && item.y === player.y);
  if (pickup) {
    pickups = pickups.filter((item) => item !== pickup);
    collectPickup(pickup);
  }

  if (enemies.some((enemy) => Math.hypot(enemy.x - player.x - 0.5, enemy.y - player.y - 0.5) < 0.8)) {
    loseLife("A Shadow Puff caught you!");
  }
}

function clearTrail() {
  player.trail.forEach(({ x, y }) => {
    if (board[y]?.[x] === TRAIL) board[y][x] = EMPTY;
  });
  player.trail = [];
}

function loseLife(message) {
  if (!game.running || game.resolving) return;
  game.resolving = true;
  clearTrail();
  playSound("hit");
  haptic([45, 35, 45]);

  if (game.shield > 0) {
    game.shield -= 1;
    showBanner("Bow shield saved you!");
  } else {
    game.lives -= 1;
    showBanner("Oh no! One heart lost");
  }

  player.x = Math.floor(COLS / 2);
  player.y = 1;
  player.direction = null;
  readyMessage.classList.remove("dismissed");
  announce(message);
  updateHUD();

  if (game.lives <= 0) {
    window.setTimeout(finishGameOver, 650);
  } else {
    window.setTimeout(() => {
      game.resolving = false;
    }, 700);
  }
}

function moveEnemies(elapsed, time) {
  const slowFactor = game.slowUntil > time ? 0.47 : game.feverUntil > time ? 0.65 : 1;

  for (const enemy of enemies) {
    if (enemy.type === "chaser" && player.trail.length) {
      const angle = Math.atan2(player.y + 0.5 - enemy.y, player.x + 0.5 - enemy.x);
      enemy.vx += Math.cos(angle) * elapsed * 0.55;
      enemy.vy += Math.sin(angle) * elapsed * 0.55;
      const speed = Math.hypot(enemy.vx, enemy.vy);
      const maximum = Math.min(5.3, 2.8 + game.level * 0.14);
      if (speed > maximum) {
        enemy.vx = (enemy.vx / speed) * maximum;
        enemy.vy = (enemy.vy / speed) * maximum;
      }
    }

    const step = elapsed * slowFactor;
    const nextX = enemy.x + enemy.vx * step;
    const nextY = enemy.y + enemy.vy * step;
    const horizontalCell = board[Math.floor(enemy.y)]?.[Math.floor(nextX)];
    const verticalCell = board[Math.floor(nextY)]?.[Math.floor(enemy.x)];

    if (horizontalCell === LAND || horizontalCell === undefined) enemy.vx *= -1;
    else enemy.x = nextX;

    if (verticalCell === LAND || verticalCell === undefined) enemy.vy *= -1;
    else enemy.y = nextY;

    const cell = board[Math.floor(enemy.y)]?.[Math.floor(enemy.x)];
    if (cell === TRAIL) {
      loseLife("A Shadow Puff touched your ribbon!");
      return;
    }

    if (
      player.trail.length &&
      Math.hypot(enemy.x - player.x - 0.5, enemy.y - player.y - 0.5) < 0.82
    ) {
      loseLife("A Shadow Puff caught you!");
      return;
    }
  }
}

/* --------------------------------------------------------------------------
 * Level results
 * ----------------------------------------------------------------------- */

function completeLevel() {
  if (!game.running || game.resolving) return;
  game.resolving = true;
  game.running = false;
  player.direction = null;
  const completedLevel = game.level;
  const landSaved = Math.round(game.captured);

  save.bestScore = Math.max(save.bestScore, game.score);
  save.highestLevel = Math.max(save.highestLevel, completedLevel + 1);
  save.totalLand += landSaved;
  persistSave();
  playSound("win");

  window.setTimeout(() => {
    showModal({
      sticker: completedLevel % 3 === 0 ? "✦" : "♥",
      kicker: `Level ${completedLevel} complete`,
      title: "Garden saved!",
      copy: `${currentWorld().surprise} Ready for a faster garden with smarter shadows?`,
      stats: [`${landSaved}% claimed`, `${game.score.toLocaleString()} points`],
      primaryLabel: "Next garden",
      secondaryLabel: "Back to menu",
      primaryAction: () => prepareLevel(completedLevel + 1, true),
      secondaryAction: showMenu,
    });
  }, 620);
}

function finishGameOver() {
  game.running = false;
  game.resolving = false;
  save.bestScore = Math.max(save.bestScore, game.score);
  save.gamesPlayed += 1;
  persistSave();

  showModal({
    sticker: "♥",
    kicker: "The shadows got this round",
    title: "Try the garden again!",
    copy: "Small safe bites rebuild the Cute Fever meter. Then take one brave giant loop.",
    stats: [`Level ${game.level}`, `${game.score.toLocaleString()} points`],
    primaryLabel: "Try again",
    secondaryLabel: "Back to menu",
    primaryAction: () => {
      game.score = game.levelStartScore;
      prepareLevel(game.level, true);
    },
    secondaryAction: showMenu,
  });
}

function showModal(options) {
  modalSticker.textContent = options.sticker;
  modalKicker.textContent = options.kicker;
  modalTitle.textContent = options.title;
  modalCopy.textContent = options.copy;
  modalStats.innerHTML = options.stats.map((stat) => `<span>${stat}</span>`).join("");
  modalPrimary.textContent = options.primaryLabel;
  modalSecondary.textContent = options.secondaryLabel;
  modalPrimaryAction = options.primaryAction;
  modalSecondaryAction = options.secondaryAction;
  gameModal.hidden = false;
}

function hideModal() {
  gameModal.hidden = true;
  modalPrimaryAction = null;
  modalSecondaryAction = null;
}

function pauseGame() {
  if (!game.running || game.paused || game.resolving) return;
  game.paused = true;
  player.direction = null;
  showModal({
    sticker: "Ⅱ",
    kicker: "Adventure paused",
    title: "Take a tiny break",
    copy: "The Shadow Puffs are frozen until Shaked is ready.",
    stats: [`${Math.round(game.captured)}% claimed`, `${game.score.toLocaleString()} points`],
    primaryLabel: "Keep playing",
    secondaryLabel: "Back to menu",
    primaryAction: resumeGame,
    secondaryAction: showMenu,
  });
}

function resumeGame() {
  game.paused = false;
  game.lastPlayerMove = performance.now();
  hideModal();
}

/* --------------------------------------------------------------------------
 * UI
 * ----------------------------------------------------------------------- */

function updateHUD() {
  scoreValue.textContent = game.score.toLocaleString();
  livesValue.textContent = `${"♥ ".repeat(Math.max(0, game.lives)).trim()}${game.shield ? `  🎀×${game.shield}` : ""}`;
  livesValue.setAttribute("aria-label", `${game.lives} lives and ${game.shield} shields`);
  landValue.textContent = String(Math.min(100, Math.floor(game.captured)));
  landFill.style.width = `${Math.min(100, (game.captured / game.target) * 100)}%`;
  comboValue.textContent = `×${game.combo + 1}`;
  feverFill.style.width = `${game.fever}%`;
  feverValue.textContent = game.feverUntil > performance.now() ? "×2" : `${Math.floor(game.fever)}%`;
}

function showBanner(message) {
  clearTimeout(bannerTimer);
  eventBanner.textContent = message;
  eventBanner.classList.remove("show");
  void eventBanner.offsetWidth;
  eventBanner.classList.add("show");
  bannerTimer = window.setTimeout(() => eventBanner.classList.remove("show"), 1300);
}

function announce(message) {
  announcer.textContent = "";
  window.setTimeout(() => {
    announcer.textContent = message;
  }, 30);
}

/* --------------------------------------------------------------------------
 * Drawing
 * ----------------------------------------------------------------------- */

function resizeCanvas() {
  const bounds = boardWrap.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const density = Math.min(devicePixelRatio || 1, 2);
  viewWidth = bounds.width;
  viewHeight = bounds.height;
  gameCanvas.width = Math.round(viewWidth * density);
  gameCanvas.height = Math.round(viewHeight * density);
  context.setTransform(density, 0, 0, density, 0, 0);
  drawGame(performance.now());
}

function cellBox(column, row) {
  return {
    x: (column / COLS) * viewWidth,
    y: (row / ROWS) * viewHeight,
    width: viewWidth / COLS,
    height: viewHeight / ROWS,
  };
}

function drawHeart(x, y, size, color) {
  context.save();
  context.translate(x, y);
  context.scale(size, size);
  context.beginPath();
  context.moveTo(0, 0.32);
  context.bezierCurveTo(-0.62, -0.08, -0.5, -0.66, 0, -0.32);
  context.bezierCurveTo(0.5, -0.66, 0.62, -0.08, 0, 0.32);
  context.fillStyle = color;
  context.fill();
  context.restore();
}

function drawKitty(column, row, time) {
  const box = cellBox(column, row);
  const unit = Math.min(box.width, box.height);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2 + Math.sin(time * 0.009) * unit * 0.08;

  context.save();
  context.translate(x, y);
  context.lineWidth = Math.max(1.1, unit * 0.13);
  context.strokeStyle = "#29183f";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(-unit * 0.62, -unit * 0.32);
  context.lineTo(-unit * 0.45, -unit * 0.9);
  context.lineTo(-unit * 0.12, -unit * 0.52);
  context.moveTo(unit * 0.15, -unit * 0.52);
  context.lineTo(unit * 0.48, -unit * 0.9);
  context.lineTo(unit * 0.62, -unit * 0.3);
  context.fillStyle = "#fffdfb";
  context.fill();
  context.stroke();

  context.beginPath();
  context.ellipse(0, 0, unit * 0.72, unit * 0.6, 0, 0, Math.PI * 2);
  context.fillStyle = "#fffdfb";
  context.fill();
  context.stroke();

  context.fillStyle = "#29183f";
  context.beginPath();
  context.ellipse(-unit * 0.25, -unit * 0.05, unit * 0.055, unit * 0.105, 0, 0, Math.PI * 2);
  context.ellipse(unit * 0.25, -unit * 0.05, unit * 0.055, unit * 0.105, 0, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.ellipse(0, unit * 0.11, unit * 0.09, unit * 0.06, 0, 0, Math.PI * 2);
  context.fillStyle = "#ffd84d";
  context.fill();
  context.stroke();

  context.lineWidth = Math.max(0.8, unit * 0.06);
  context.beginPath();
  context.moveTo(-unit * 0.42, unit * 0.08);
  context.lineTo(-unit * 0.85, -unit * 0.02);
  context.moveTo(-unit * 0.42, unit * 0.22);
  context.lineTo(-unit * 0.84, unit * 0.29);
  context.moveTo(unit * 0.42, unit * 0.08);
  context.lineTo(unit * 0.85, -unit * 0.02);
  context.moveTo(unit * 0.42, unit * 0.22);
  context.lineTo(unit * 0.84, unit * 0.29);
  context.stroke();

  context.beginPath();
  context.ellipse(unit * 0.52, -unit * 0.56, unit * 0.28, unit * 0.19, -0.35, 0, Math.PI * 2);
  context.ellipse(unit * 0.9, -unit * 0.55, unit * 0.28, unit * 0.19, 0.35, 0, Math.PI * 2);
  context.fillStyle = "#ff4f91";
  context.fill();
  context.stroke();
  context.beginPath();
  context.arc(unit * 0.71, -unit * 0.55, unit * 0.13, 0, Math.PI * 2);
  context.fillStyle = "#e93479";
  context.fill();
  context.stroke();
  context.restore();
}

function drawEnemy(enemy, time) {
  const box = cellBox(enemy.x, enemy.y);
  const unit = Math.min(box.width, box.height);
  const x = box.x;
  const y = box.y;
  const pulse = 1 + Math.sin(time * 0.006 + enemy.phase) * 0.08;

  context.save();
  context.translate(x, y);
  context.scale(pulse, pulse);
  context.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = (point / 10) * Math.PI * 2;
    const radius = unit * (point % 2 ? 0.72 : 0.58);
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (point === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fillStyle = enemy.type === "chaser" ? "#ff4f73" : "#8d69d4";
  context.shadowColor = enemy.type === "chaser" ? "#ff4f73" : "#c3a6ff";
  context.shadowBlur = unit * 0.8;
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "white";
  context.beginPath();
  context.arc(-unit * 0.2, -unit * 0.06, unit * 0.15, 0, Math.PI * 2);
  context.arc(unit * 0.2, -unit * 0.06, unit * 0.15, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#29183f";
  context.beginPath();
  context.arc(-unit * 0.17, -unit * 0.04, unit * 0.065, 0, Math.PI * 2);
  context.arc(unit * 0.17, -unit * 0.04, unit * 0.065, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawPickup(pickup, time) {
  const box = cellBox(pickup.x, pickup.y);
  const unit = Math.min(box.width, box.height);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2 + Math.sin(time * 0.007 + pickup.phase) * unit * 0.18;

  context.save();
  context.translate(x, y);
  context.shadowColor = "#fff";
  context.shadowBlur = unit;
  if (pickup.type === "strawberry") {
    drawHeart(0, 0, unit * 0.7, "#ff4f73");
    context.fillStyle = "#69dfc2";
    context.fillRect(-unit * 0.25, -unit * 0.48, unit * 0.5, unit * 0.14);
  } else if (pickup.type === "shield") {
    context.font = `${unit * 1.25}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("🎀", 0, 0);
  } else {
    context.font = `${unit * 1.2}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("🥛", 0, 0);
  }
  context.restore();
}

function drawGame(time = performance.now()) {
  if (!viewWidth || !viewHeight || !board.length) return;
  const world = currentWorld();
  const cellWidth = viewWidth / COLS;
  const cellHeight = viewHeight / ROWS;
  const feverActive = game.feverUntil > time;

  const gradient = context.createRadialGradient(
    viewWidth * 0.5,
    viewHeight * 0.42,
    0,
    viewWidth * 0.5,
    viewHeight * 0.42,
    viewHeight * 0.72,
  );
  gradient.addColorStop(0, feverActive ? "#592969" : world.emptyGlow);
  gradient.addColorStop(1, world.empty);
  context.fillStyle = gradient;
  context.fillRect(0, 0, viewWidth, viewHeight);

  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLS; column += 1) {
      const cell = board[row][column];
      const x = column * cellWidth;
      const y = row * cellHeight;
      if (cell === LAND) {
        context.fillStyle = (row + column) % 2 ? world.land : world.landAlt;
        context.fillRect(x, y, cellWidth + 0.4, cellHeight + 0.4);
        context.strokeStyle = "rgba(41,24,63,0.08)";
        context.strokeRect(x + 0.25, y + 0.25, cellWidth - 0.5, cellHeight - 0.5);
        if ((row * 3 + column) % 17 === 0) {
          drawHeart(x + cellWidth / 2, y + cellHeight / 2, Math.min(cellWidth, cellHeight) * 0.22, "rgba(255,255,255,0.55)");
        }
      } else if (cell === TRAIL) {
        context.fillStyle = feverActive ? "#ffd84d" : "#ffedf5";
        context.shadowColor = feverActive ? "#ffd84d" : "#ff6aaa";
        context.shadowBlur = Math.min(cellWidth, cellHeight) * 1.1;
        context.fillRect(x + cellWidth * 0.22, y, cellWidth * 0.56, cellHeight + 0.5);
        context.shadowBlur = 0;
      } else if ((row + column * 2) % 23 === 0) {
        context.fillStyle = "rgba(255,255,255,0.13)";
        context.beginPath();
        context.arc(x + cellWidth / 2, y + cellHeight / 2, 0.8, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  pickups.forEach((pickup) => drawPickup(pickup, time));
  enemies.forEach((enemy) => drawEnemy(enemy, time));
  drawKitty(player.x, player.y, time);

  if (feverActive) {
    context.strokeStyle = `hsla(${(time * 0.12) % 360}, 95%, 72%, 0.8)`;
    context.lineWidth = 5;
    context.strokeRect(3, 3, viewWidth - 6, viewHeight - 6);
  }
}

/* --------------------------------------------------------------------------
 * Input
 * ----------------------------------------------------------------------- */

function setDirection(direction) {
  if (!game.running || game.paused || game.resolving || !DIRECTIONS[direction]) return;
  player.direction = direction;
  readyMessage.classList.add("dismissed");
  playSound("turn");
}

let gesture = null;

function clearGesture(pointerId = null) {
  if (pointerId !== null && gesture?.pointerId !== pointerId) return;
  gesture = null;
}

gameCanvas.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary) return;
  event.preventDefault();
  clearGesture();
  gesture = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
  };
  gameCanvas.setPointerCapture?.(event.pointerId);
});

gameCanvas.addEventListener("pointermove", (event) => {
  if (gesture?.pointerId !== event.pointerId) return;
  event.preventDefault();
  gesture.lastX = event.clientX;
  gesture.lastY = event.clientY;
});

gameCanvas.addEventListener("pointerup", (event) => {
  if (gesture?.pointerId !== event.pointerId) return;
  event.preventDefault();
  const deltaX = event.clientX - gesture.startX;
  const deltaY = event.clientY - gesture.startY;
  const horizontal = Math.abs(deltaX);
  const vertical = Math.abs(deltaY);
  const minimumSwipe = 11;

  if (Math.max(horizontal, vertical) >= minimumSwipe) {
    if (horizontal >= vertical) setDirection(deltaX < 0 ? "left" : "right");
    else setDirection(deltaY < 0 ? "up" : "down");
  }
  clearGesture(event.pointerId);
});

gameCanvas.addEventListener("pointercancel", (event) => clearGesture(event.pointerId));
gameCanvas.addEventListener("lostpointercapture", (event) => clearGesture(event.pointerId));
gameCanvas.addEventListener("contextmenu", (event) => event.preventDefault());

document.addEventListener("keydown", (event) => {
  if (gameScreen.hidden) return;
  const keyMap = {
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right",
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down",
  };
  const direction = keyMap[event.key.toLowerCase()];
  if (direction) {
    event.preventDefault();
    setDirection(direction);
  } else if (event.key === "Escape" || event.key.toLowerCase() === "p") {
    event.preventDefault();
    if (game.paused) resumeGame();
    else pauseGame();
  }
});

/* --------------------------------------------------------------------------
 * Loop and lifecycle
 * ----------------------------------------------------------------------- */

function gameLoop(time) {
  const elapsed = Math.min(0.04, Math.max(0, (time - lastFrame) / 1000));
  lastFrame = time;

  if (game.running && !game.paused && !game.resolving) {
    const moveDelay = Math.max(54, 98 - game.level * 1.8);
    if (time - game.lastPlayerMove >= moveDelay) {
      movePlayer();
      game.lastPlayerMove = time;
    }
    moveEnemies(elapsed, time);
    pickups = pickups.filter((pickup) => pickup.expiresAt > time);
    if (time >= game.nextPickupAt) {
      spawnPickup();
      game.nextPickupAt = time + Math.max(7000, 12500 - game.level * 180);
    }
    if (game.feverUntil && time > game.feverUntil) game.feverUntil = 0;
    updateHUD();
  }

  if (!gameScreen.hidden) drawGame(time);
  animationFrame = requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", startAdventure);
resetButton.addEventListener("click", () => {
  if (!confirm("Reset Shaked's saved levels and high score?")) return;
  save = defaultSave();
  persistSave();
  soundEnabled = true;
  updateMenu();
  updateSoundButton();
});
homeButton.addEventListener("click", showMenu);
pauseButton.addEventListener("click", pauseGame);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  save.sound = soundEnabled;
  persistSave();
  updateSoundButton();
  if (soundEnabled) playSound("bonus");
});
modalPrimary.addEventListener("click", () => modalPrimaryAction?.());
modalSecondary.addEventListener("click", () => modalSecondaryAction?.());

document.addEventListener("visibilitychange", () => {
  clearGesture();
  if (document.hidden && game.running && !game.paused) pauseGame();
});

addEventListener("resize", resizeCanvas, { passive: true });
addEventListener("pagehide", () => {
  storeRunProgress();
  cancelAnimationFrame(animationFrame);
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .then(() => navigator.serviceWorker.ready)
    .then(() => {
      offlineBadge.textContent = "Ready offline";
      offlineBadge.classList.add("ready");
    })
    .catch(() => {
      offlineBadge.textContent = navigator.onLine ? "Open online once more" : "Offline unavailable";
    });
} else {
  offlineBadge.textContent = "Online mode";
}

updateMenu();
updateSoundButton();
createBoard();
resizeCanvas();
animationFrame = requestAnimationFrame(gameLoop);
