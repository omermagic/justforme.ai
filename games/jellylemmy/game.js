"use strict";

/* --------------------------------------------------------------------------
 * World and level design
 * ----------------------------------------------------------------------- */

const WORLD_WIDTH = 32;
const WORLD_HEIGHT = 18;
const EMPTY = 0;
const SOFT = 1;
const STEEL = 2;
const SAVE_KEY = "jellylemmy_save_v1";
const SKILLS = ["turn", "build", "dig", "bash", "float"];

const THEMES = {
  rose: { sky: "#39234f", glow: "#ff8fb8", soil: "#b55f8d", soilTop: "#ffb4d0" },
  mint: { sky: "#123e45", glow: "#8ce5c3", soil: "#347f77", soilTop: "#9cf3d3" },
  blue: { sky: "#162b58", glow: "#8ec8ff", soil: "#526fa5", soilTop: "#b6d9ff" },
  gold: { sky: "#4a2d18", glow: "#ffd85c", soil: "#a16935", soilTop: "#ffe89a" },
  plum: { sky: "#25163f", glow: "#ad8bf2", soil: "#675099", soilTop: "#c8b1ff" },
};

const DOLL_TYPES = [
  ["bunny", "Velvet Bunny"],
  ["bear", "Cocoa Bear"],
  ["frog", "Mossy Frog"],
  ["cat", "Cloud Cat"],
  ["duck", "Butter Duck"],
  ["elephant", "Pebble Elephant"],
  ["fox", "Toffee Fox"],
  ["penguin", "Moon Penguin"],
  ["dragon", "Pocket Dragon"],
  ["puppy", "Pudding Puppy"],
  ["mouse", "Button Mouse"],
  ["whale", "Blueberry Whale"],
];

function platform(x, y, width, height = 2, type = SOFT) {
  return { x, y, width, height, type };
}

function doll(x, y, typeIndex) {
  const [type, name] = DOLL_TYPES[typeIndex % DOLL_TYPES.length];
  return { x, y, type, name, id: `${typeIndex}-${name}` };
}

const LEVELS = [
  {
    name: "Plush Parade",
    subtitle: "A gentle first rescue",
    theme: "rose",
    population: 6, rescue: 4, time: 100, spawnEvery: 2.5, speed: 1.45,
    skills: { turn: 3, build: 0, dig: 0, bash: 0, float: 0 },
    spawn: { x: 3, y: 4, dir: 1 }, exit: { x: 29, y: 16 },
    terrain: [platform(0, 16, 32)], hazards: [],
    dolls: [doll(12, 16, 0), doll(23, 16, 1)],
    tip: "Start easy: collect both plush friends and guide four Lemmies home.",
  },
  {
    name: "Stairway to Snuggles",
    subtitle: "Build into the clouds",
    theme: "blue",
    population: 7, rescue: 5, time: 105, spawnEvery: 2.25, speed: 1.5,
    skills: { turn: 2, build: 4, dig: 0, bash: 0, float: 0 },
    spawn: { x: 3, y: 4, dir: 1 }, exit: { x: 29, y: 12 },
    terrain: [platform(0, 16, 13), platform(20, 12, 12, 6)],
    hazards: [{ x: 13, y: 17, width: 7, kind: "cloud" }],
    dolls: [doll(8, 16, 2), doll(25, 12, 3)],
    tip: "Use Build near the edge. Each bridge climbs gently upward.",
  },
  {
    name: "Secret Burrow",
    subtitle: "The best route is below",
    theme: "gold",
    population: 7, rescue: 5, time: 100, spawnEvery: 2.05, speed: 1.55,
    skills: { turn: 2, build: 0, dig: 4, bash: 0, float: 1 },
    spawn: { x: 3, y: 3, dir: 1 }, exit: { x: 28, y: 16 },
    terrain: [platform(0, 8, 32, 1), platform(0, 16, 32)], hazards: [],
    dolls: [doll(10, 8, 4), doll(18, 16, 5), doll(25, 16, 6)],
    tip: "Collect the top plush, then Dig through the soft shelf.",
  },
  {
    name: "Cloudy Cuddles",
    subtitle: "A very long way down",
    theme: "plum",
    population: 6, rescue: 5, time: 96, spawnEvery: 1.9, speed: 1.6,
    skills: { turn: 2, build: 0, dig: 0, bash: 0, float: 6 },
    spawn: { x: 2, y: 2, dir: 1 }, exit: { x: 29, y: 16 },
    terrain: [platform(0, 6, 11, 1), platform(10, 16, 22)], hazards: [],
    dolls: [doll(6, 6, 7), doll(18, 16, 8), doll(26, 16, 9)],
    tip: "Give each brave Lemmy a Float before the big drop.",
  },
  {
    name: "Tea-Shop Tunnel",
    subtitle: "There is a wall in the way",
    theme: "mint",
    population: 8, rescue: 6, time: 94, spawnEvery: 1.75, speed: 1.65,
    skills: { turn: 2, build: 0, dig: 0, bash: 4, float: 0 },
    spawn: { x: 3, y: 4, dir: 1 }, exit: { x: 29, y: 16 },
    terrain: [platform(0, 16, 32), platform(14, 10, 3, 6)], hazards: [],
    dolls: [doll(9, 16, 10), doll(21, 16, 11), doll(27, 16, 0)],
    tip: "Tap Bash when a Lemmy reaches the tall cake wall.",
  },
  {
    name: "Double-Decker Den",
    subtitle: "Down, across and through",
    theme: "rose",
    population: 8, rescue: 6, time: 92, spawnEvery: 1.65, speed: 1.7,
    skills: { turn: 3, build: 0, dig: 4, bash: 4, float: 1 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 29, y: 16 },
    terrain: [platform(0, 8, 18, 1), platform(0, 16, 32), platform(21, 11, 2, 5)],
    hazards: [], dolls: [doll(9, 8, 1), doll(17, 16, 2), doll(26, 16, 3)],
    tip: "Dig from the upper shelf, then Bash through the lower wall.",
  },
  {
    name: "Bubble-Bath Bridge",
    subtitle: "Do not splash the fluff",
    theme: "blue",
    population: 9, rescue: 7, time: 90, spawnEvery: 1.5, speed: 1.76,
    skills: { turn: 3, build: 5, dig: 0, bash: 0, float: 1 },
    spawn: { x: 2, y: 4, dir: 1 }, exit: { x: 29, y: 12 },
    terrain: [platform(0, 16, 13), platform(20, 12, 12, 6)],
    hazards: [{ x: 13, y: 16.5, width: 7, kind: "water" }],
    dolls: [doll(7, 16, 4), doll(23, 12, 5), doll(28, 12, 6)],
    tip: "Build early. The bath is wider and the troop arrives faster.",
  },
  {
    name: "Moon-Shelf Climb",
    subtitle: "Four shelves, one moon",
    theme: "plum",
    population: 9, rescue: 7, time: 88, spawnEvery: 1.42, speed: 1.82,
    skills: { turn: 4, build: 7, dig: 0, bash: 0, float: 2 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 30, y: 7 },
    terrain: [platform(0, 16, 9), platform(11, 13, 7, 5), platform(20, 10, 7, 8), platform(29, 7, 3, 11)],
    hazards: [{ x: 9, y: 17, width: 2, kind: "stars" }, { x: 18, y: 17, width: 2, kind: "stars" }],
    dolls: [doll(6, 16, 7), doll(15, 13, 8), doll(24, 10, 9), doll(30, 7, 10)],
    tip: "Short bridges connect the moon shelves. Timing matters now.",
  },
  {
    name: "Steel Toybox",
    subtitle: "Some walls cannot be bashed",
    theme: "gold",
    population: 10, rescue: 8, time: 86, spawnEvery: 1.34, speed: 1.88,
    skills: { turn: 4, build: 5, dig: 1, bash: 4, float: 2 },
    spawn: { x: 2, y: 4, dir: 1 }, exit: { x: 30, y: 16 },
    terrain: [platform(0, 16, 32), platform(11, 12, 2, 4, STEEL), platform(22, 10, 2, 6)],
    hazards: [], dolls: [doll(7, 16, 11), doll(16, 16, 0), doll(27, 16, 1)],
    tip: "Build over silver steel. Save Bash for the soft wall beyond it.",
  },
  {
    name: "Stormy Nursery",
    subtitle: "Three islands in the dark",
    theme: "mint",
    population: 10, rescue: 8, time: 84, spawnEvery: 1.25, speed: 1.94,
    skills: { turn: 4, build: 6, dig: 1, bash: 1, float: 6 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 29, y: 12 },
    terrain: [platform(0, 9, 9, 1), platform(11, 16, 9), platform(23, 12, 9, 6)],
    hazards: [{ x: 9, y: 17, width: 2, kind: "storm" }, { x: 20, y: 17, width: 3, kind: "storm" }],
    dolls: [doll(6, 9, 2), doll(15, 16, 3), doll(26, 12, 4), doll(30, 12, 5)],
    tip: "Float to the middle island, then build before the final storm gap.",
  },
  {
    name: "The Great Plush Hunt",
    subtitle: "Every corner holds a friend",
    theme: "rose",
    population: 11, rescue: 9, time: 82, spawnEvery: 1.16, speed: 2,
    skills: { turn: 5, build: 5, dig: 5, bash: 4, float: 4 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 2, y: 16 },
    terrain: [platform(0, 7, 32, 1), platform(0, 16, 32), platform(13, 11, 3, 5)],
    hazards: [], dolls: [doll(7, 7, 6), doll(25, 7, 7), doll(9, 16, 8), doll(20, 16, 9), doll(28, 16, 10)],
    tip: "The exit is behind you. Hunt every shelf, then turn the troop home.",
  },
  {
    name: "Midnight Plush Museum",
    subtitle: "The grand final rescue",
    theme: "plum",
    population: 12, rescue: 10, time: 80, spawnEvery: 1.05, speed: 2.08,
    skills: { turn: 5, build: 7, dig: 4, bash: 5, float: 6 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 30, y: 10 },
    terrain: [platform(0, 16, 11), platform(11, 11, 2, 5), platform(16, 16, 6), platform(25, 10, 7, 8), platform(21, 13, 2, 3, STEEL)],
    hazards: [{ x: 13, y: 17, width: 3, kind: "stars" }, { x: 23, y: 17, width: 2, kind: "stars" }],
    dolls: [doll(7, 16, 11), doll(12, 11, 0), doll(18, 16, 1), doll(26, 10, 2), doll(30, 10, 8)],
    tip: "Use everything you learned. The rare Pocket Dragon is waiting.",
  },
];

/* --------------------------------------------------------------------------
 * DOM and saved progress
 * ----------------------------------------------------------------------- */

const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const continueButton = document.getElementById("continue-button");
const resetButton = document.getElementById("reset-button");
const offlineBadge = document.getElementById("offline-badge");
const unlockedValue = document.getElementById("unlocked-value");
const collectionValue = document.getElementById("collection-value");
const bestScoreValue = document.getElementById("best-score-value");
const levelGrid = document.getElementById("level-grid");

const menuButton = document.getElementById("menu-button");
const soundButton = document.getElementById("sound-button");
const pauseButton = document.getElementById("pause-button");
const restartButton = document.getElementById("restart-button");
const levelKicker = document.getElementById("level-kicker");
const levelName = document.getElementById("level-name");
const rescueValue = document.getElementById("rescue-value");
const dollValue = document.getElementById("doll-value");
const timeValue = document.getElementById("time-value");
const missionText = document.getElementById("mission-text");
const releaseFill = document.getElementById("release-fill");
const gameStage = document.getElementById("game-stage");
const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");
const toast = document.getElementById("toast");
const tapHint = document.getElementById("tap-hint");
const skillButtons = [...document.querySelectorAll(".skill-button")];
const announcer = document.getElementById("announcer");

const modal = document.getElementById("game-modal");
const modalSticker = document.getElementById("modal-sticker");
const modalKicker = document.getElementById("modal-kicker");
const modalTitle = document.getElementById("modal-title");
const modalCopy = document.getElementById("modal-copy");
const modalStats = document.getElementById("modal-stats");
const modalPrimary = document.getElementById("modal-primary");
const modalSecondary = document.getElementById("modal-secondary");

function defaultSave() {
  return { unlocked: 1, collection: [], bestScores: {}, stars: {}, sound: true };
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

function bestTotal() {
  return Object.values(save.bestScores).reduce((sum, score) => sum + Number(score || 0), 0);
}

function updateMenu() {
  unlockedValue.textContent = `${Math.min(save.unlocked, LEVELS.length)} / ${LEVELS.length}`;
  collectionValue.textContent = String(new Set(save.collection).size);
  bestScoreValue.textContent = bestTotal().toLocaleString();
  continueButton.textContent = save.unlocked > 1 ? `Continue at level ${Math.min(save.unlocked, LEVELS.length)}` : "Begin rescue";
  renderLevelGrid();
}

function renderLevelGrid() {
  levelGrid.innerHTML = "";
  LEVELS.forEach((level, index) => {
    const unlocked = index < save.unlocked;
    const stars = Number(save.stars[index] || 0);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-card";
    button.disabled = !unlocked;
    button.innerHTML = `<span>Level ${index + 1}</span><i class="stars">${unlocked ? `${"★".repeat(stars)}${"☆".repeat(3 - stars)}` : "🔒"}</i><strong>${level.name}</strong><small>${level.dolls.length} plush</small>`;
    button.addEventListener("click", () => startLevel(index));
    levelGrid.appendChild(button);
  });
}

/* --------------------------------------------------------------------------
 * Sound
 * ----------------------------------------------------------------------- */

let audioContext = null;
let soundEnabled = save.sound !== false;

function tone(frequency, duration = 0.08, delay = 0, type = "sine", volume = 0.03) {
  if (!soundEnabled) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!audioContext && AudioContextClass) audioContext = new AudioContextClass();
  if (!audioContext) return;
  if (audioContext.state === "suspended") audioContext.resume();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const start = audioContext.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playSound(name) {
  const patterns = {
    start: [440, 554, 659], collect: [784, 988, 1175], skill: [520, 680],
    rescue: [659, 880], lose: [240, 180, 130], win: [523, 659, 784, 1047, 1319],
  };
  (patterns[name] || []).forEach((note, index) => tone(note, 0.12, index * 0.055, name === "lose" ? "sawtooth" : "triangle"));
}

function updateSoundButton() {
  soundButton.textContent = soundEnabled ? "♪" : "×";
  soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
}

/* --------------------------------------------------------------------------
 * Game state and terrain
 * ----------------------------------------------------------------------- */

let tiles = [];
let units = [];
let dolls = [];
let hazards = [];
let particles = [];
let currentLevelIndex = 0;
let currentLevel = LEVELS[0];
let skills = {};
let selectedSkill = null;
let spawned = 0;
let rescued = 0;
let lost = 0;
let collected = 0;
let timeLeft = 0;
let spawnClock = 0;
let running = false;
let paused = false;
let resolving = false;
let lastFrame = performance.now();
let animationFrame = 0;
let viewWidth = 960;
let viewHeight = 540;
let toastTimer = 0;
let modalPrimaryAction = null;
let modalSecondaryAction = null;

function createTerrain() {
  tiles = Array.from({ length: WORLD_HEIGHT }, () => Array(WORLD_WIDTH).fill(EMPTY));
  currentLevel.terrain.forEach((area) => {
    for (let y = area.y; y < Math.min(WORLD_HEIGHT, area.y + area.height); y += 1) {
      for (let x = area.x; x < Math.min(WORLD_WIDTH, area.x + area.width); x += 1) {
        tiles[y][x] = area.type;
      }
    }
  });
}

function tileAt(x, y) {
  if (x < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) return STEEL;
  if (y < 0) return EMPTY;
  return tiles[y][x];
}

function isSolid(x, y) {
  return tileAt(x, y) !== EMPTY;
}

function setTile(x, y, value) {
  if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) tiles[y][x] = value;
}

function startLevel(index) {
  currentLevelIndex = Math.max(0, Math.min(index, LEVELS.length - 1));
  currentLevel = LEVELS[currentLevelIndex];
  skills = { ...currentLevel.skills };
  units = [];
  dolls = currentLevel.dolls.map((item) => ({ ...item, collected: false, bob: Math.random() * 6 }));
  hazards = currentLevel.hazards.map((item) => ({ ...item }));
  particles = [];
  selectedSkill = null;
  spawned = 0;
  rescued = 0;
  lost = 0;
  collected = 0;
  timeLeft = currentLevel.time;
  spawnClock = 0.7;
  running = true;
  paused = false;
  resolving = false;
  lastFrame = performance.now();
  createTerrain();
  hideModal();
  menuScreen.hidden = true;
  gameScreen.hidden = false;
  document.body.classList.add("playing");
  levelKicker.textContent = `Level ${currentLevelIndex + 1} · ${currentLevel.subtitle}`;
  levelName.textContent = currentLevel.name;
  missionText.textContent = currentLevel.tip;
  tapHint.classList.remove("dismissed");
  updateSkillDock();
  updateHUD();
  resizeCanvas();
  playSound("start");
  announce(`${currentLevel.name}. Collect ${dolls.length} plush friends and rescue ${currentLevel.rescue} Lemmies.`);
}

function spawnUnit() {
  const spawn = currentLevel.spawn;
  units.push({
    id: `${currentLevelIndex}-${spawned}-${Date.now()}`,
    x: spawn.x + (Math.random() - 0.5) * 0.12,
    y: spawn.y,
    dir: spawn.dir,
    vy: 0,
    state: "fall",
    fallStart: spawn.y,
    safeFall: true,
    float: false,
    actionTimer: 0,
    actionStep: 0,
    active: true,
    phase: Math.random() * 6,
  });
  spawned += 1;
}

function isGrounded(unit) {
  return isSolid(Math.floor(unit.x), Math.floor(unit.y + 0.08));
}

function landUnit(unit, row) {
  const distance = unit.y - unit.fallStart;
  unit.y = row;
  unit.vy = 0;
  if (distance > 5.25 && !unit.float && !unit.safeFall) {
    loseUnit(unit, "A Lemmy tumbled too far!");
  } else {
    unit.state = "walk";
    if (unit.float) unit.float = false;
  }
  unit.safeFall = false;
}

function updateFalling(unit, elapsed) {
  unit.vy = Math.min(unit.float ? 3.2 : 9.5, unit.vy + (unit.float ? 5 : 18) * elapsed);
  const previousY = unit.y;
  const nextY = unit.y + unit.vy * elapsed;
  const column = Math.floor(unit.x);
  for (let row = Math.floor(previousY); row <= Math.floor(nextY + 0.08); row += 1) {
    if (isSolid(column, row)) {
      landUnit(unit, row);
      return;
    }
  }
  unit.y = nextY;
  unit.x += unit.dir * currentLevel.speed * 0.28 * elapsed;
  if (unit.y > WORLD_HEIGHT + 1) loseUnit(unit, "A Lemmy disappeared into the fluff below!");
}

function updateWalking(unit, elapsed) {
  if (!isGrounded(unit)) {
    unit.state = "fall";
    unit.fallStart = unit.y;
    unit.vy = 0;
    return;
  }

  const nextX = unit.x + unit.dir * currentLevel.speed * elapsed;
  const aheadColumn = Math.floor(nextX + unit.dir * 0.28);
  const bodyRow = Math.floor(unit.y - 0.35);
  if (isSolid(aheadColumn, bodyRow)) {
    if (!isSolid(aheadColumn, bodyRow - 1)) {
      unit.y = bodyRow;
      unit.x = nextX;
    } else {
      unit.dir *= -1;
    }
  } else {
    unit.x = nextX;
  }
}

function updateBuilder(unit, elapsed) {
  unit.actionTimer -= elapsed;
  if (unit.actionTimer > 0) return;
  unit.actionTimer = 0.19;
  const targetColumn = Math.floor(unit.x + unit.dir * 0.82);
  const rise = unit.actionStep % 2 === 1 ? 1 : 0;
  const targetRow = Math.floor(unit.y + 0.08) - rise;
  if (tileAt(targetColumn, targetRow) === STEEL || isSolid(targetColumn, targetRow - 1)) {
    unit.state = "walk";
    unit.dir *= -1;
    return;
  }
  setTile(targetColumn, targetRow, SOFT);
  unit.x = targetColumn + 0.5;
  unit.y = targetRow;
  unit.actionStep += 1;
  burst(unit.x, unit.y - 0.4, "#ffd85c", 3);
  if (unit.actionStep >= 8) unit.state = "walk";
}

function updateBasher(unit, elapsed) {
  unit.actionTimer -= elapsed;
  if (unit.actionTimer > 0) return;
  unit.actionTimer = 0.12;
  const column = Math.floor(unit.x + unit.dir * 0.7);
  const footRow = Math.floor(unit.y + 0.08);
  let cleared = false;
  for (const row of [footRow - 1, footRow - 2]) {
    if (tileAt(column, row) === SOFT) {
      setTile(column, row, EMPTY);
      cleared = true;
    }
  }
  if (!cleared && (tileAt(column, footRow - 1) === STEEL || unit.actionStep > 1)) {
    unit.state = "walk";
    unit.dir *= tileAt(column, footRow - 1) === STEEL ? -1 : 1;
    return;
  }
  unit.x += unit.dir * 0.46;
  unit.actionStep += 1;
  burst(unit.x, unit.y - 0.6, "#fff0c7", 2);
  if (unit.actionStep >= 12) unit.state = "walk";
}

function updateUnit(unit, elapsed) {
  if (!unit.active) return;
  if (unit.state === "build") updateBuilder(unit, elapsed);
  else if (unit.state === "bash") updateBasher(unit, elapsed);
  else if (unit.state === "fall") updateFalling(unit, elapsed);
  else updateWalking(unit, elapsed);
  if (!unit.active) return;
  checkDolls(unit);
  checkHazards(unit);
  checkExit(unit);
}

function checkDolls(unit) {
  dolls.forEach((item) => {
    if (!item.collected && Math.abs(unit.x - item.x) < 0.75 && Math.abs(unit.y - item.y) < 1.05) {
      item.collected = true;
      collected += 1;
      if (!save.collection.includes(item.id)) save.collection.push(item.id);
      persistSave();
      burst(item.x, item.y - 0.6, "#ff8fb8", 12);
      showToast(`${item.name} found!`);
      playSound("collect");
      navigator.vibrate?.(18);
    }
  });
}

function checkHazards(unit) {
  hazards.forEach((hazard) => {
    if (unit.active && unit.x > hazard.x && unit.x < hazard.x + hazard.width && unit.y >= hazard.y) {
      loseUnit(unit, "A Lemmy touched the danger zone!");
    }
  });
}

function checkExit(unit) {
  const exit = currentLevel.exit;
  if (Math.abs(unit.x - exit.x) < 0.72 && Math.abs(unit.y - exit.y) < 1.05) {
    unit.active = false;
    rescued += 1;
    burst(exit.x, exit.y - 0.8, "#8ce5c3", 10);
    playSound("rescue");
    showToast(`${rescued} ${rescued === 1 ? "Lemmy" : "Lemmies"} home!`);
  }
}

function loseUnit(unit, message) {
  if (!unit.active) return;
  unit.active = false;
  lost += 1;
  burst(unit.x, Math.min(unit.y, WORLD_HEIGHT - 1), "#ffffff", 8);
  if (lost <= 2) showToast(message);
}

/* --------------------------------------------------------------------------
 * Skills and input
 * ----------------------------------------------------------------------- */

function selectSkill(skill) {
  if (!running || paused || resolving || !skills[skill]) return;
  selectedSkill = selectedSkill === skill ? null : skill;
  tapHint.textContent = selectedSkill ? `Tap a Lemmy to use ${selectedSkill}` : "Choose a skill below, then tap a Lemmy";
  updateSkillDock();
}

function nearestUnit(x, y) {
  let nearest = null;
  let distance = 1.4;
  units.forEach((unit) => {
    if (!unit.active) return;
    const current = Math.hypot(unit.x - x, unit.y - y);
    if (current < distance) {
      distance = current;
      nearest = unit;
    }
  });
  return nearest;
}

function applySkill(unit, skill) {
  if (!unit || !skills[skill] || !unit.active) return false;
  if (skill === "float") {
    unit.float = true;
  } else if (skill === "turn") {
    unit.dir *= -1;
  } else if (skill === "dig") {
    const row = Math.floor(unit.y + 0.08);
    const columns = [Math.floor(unit.x), Math.floor(unit.x + unit.dir * 0.35)];
    if (!columns.some((column) => tileAt(column, row) === SOFT)) {
      showToast("That floor cannot be dug!");
      return false;
    }
    columns.forEach((column) => {
      if (tileAt(column, row) === SOFT) setTile(column, row, EMPTY);
    });
    unit.state = "fall";
    unit.fallStart = unit.y;
    unit.vy = 0;
  } else if (skill === "build") {
    if (!isGrounded(unit)) {
      showToast("Build needs solid ground!");
      return false;
    }
    unit.state = "build";
    unit.actionTimer = 0;
    unit.actionStep = 0;
  } else if (skill === "bash") {
    if (!isGrounded(unit)) {
      showToast("Bash needs solid ground!");
      return false;
    }
    unit.state = "bash";
    unit.actionTimer = 0;
    unit.actionStep = 0;
  }

  skills[skill] -= 1;
  selectedSkill = null;
  tapHint.classList.add("dismissed");
  updateSkillDock();
  playSound("skill");
  navigator.vibrate?.(12);
  burst(unit.x, unit.y - 0.7, "#ffd85c", 7);
  return true;
}

function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * WORLD_WIDTH,
    y: ((event.clientY - box.top) / box.height) * WORLD_HEIGHT,
  };
}

canvas.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || !running || paused || resolving) return;
  event.preventDefault();
  const point = canvasPoint(event);
  const unit = nearestUnit(point.x, point.y);
  if (!selectedSkill) {
    showToast(unit ? "Choose a skill first" : currentLevel.tip);
    return;
  }
  if (!unit) {
    showToast("Tap closer to a Lemmy");
    return;
  }
  applySkill(unit, selectedSkill);
});

skillButtons.forEach((button) => button.addEventListener("click", () => selectSkill(button.dataset.skill)));

document.addEventListener("keydown", (event) => {
  if (gameScreen.hidden) return;
  const keySkills = { "1": "turn", "2": "build", "3": "dig", "4": "bash", "5": "float" };
  if (keySkills[event.key]) selectSkill(keySkills[event.key]);
  else if (event.key.toLowerCase() === "r") startLevel(currentLevelIndex);
  else if (event.key === "Escape" || event.key.toLowerCase() === "p") togglePause();
});

/* --------------------------------------------------------------------------
 * Level results and UI
 * ----------------------------------------------------------------------- */

function remainingSkills() {
  return SKILLS.reduce((sum, skill) => sum + skills[skill], 0);
}

function finishLevel() {
  if (resolving) return;
  resolving = true;
  running = false;
  const stars = lost === 0 ? 3 : lost === 1 ? 2 : 1;
  const score = rescued * 500 + collected * 900 + Math.floor(timeLeft) * 12 + remainingSkills() * 80;
  save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, currentLevelIndex + 2));
  save.bestScores[currentLevelIndex] = Math.max(Number(save.bestScores[currentLevelIndex] || 0), score);
  save.stars[currentLevelIndex] = Math.max(Number(save.stars[currentLevelIndex] || 0), stars);
  persistSave();
  playSound("win");
  showModal({
    sticker: stars === 3 ? "✦" : "♥",
    kicker: `Level ${currentLevelIndex + 1} complete · ${"★".repeat(stars)}`,
    title: "The plush friends are safe!",
    copy: currentLevelIndex === LEVELS.length - 1
      ? "The Midnight Museum is glowing. Every brave choice led the Lemmies home."
      : `Next up: ${LEVELS[currentLevelIndex + 1].name}. It is a little trickier and has a brand-new surprise.`,
    stats: [`${rescued} rescued`, `${collected} plush`, `${score.toLocaleString()} pts`],
    primaryLabel: currentLevelIndex === LEVELS.length - 1 ? "Play again" : "Next level",
    primaryAction: () => startLevel(currentLevelIndex === LEVELS.length - 1 ? 0 : currentLevelIndex + 1),
    secondaryLabel: "Back to levels",
    secondaryAction: showMenu,
  });
}

function failLevel(reason) {
  if (resolving) return;
  resolving = true;
  running = false;
  playSound("lose");
  showModal({
    sticker: "♡",
    kicker: "The rescue needs another plan",
    title: "So close!",
    copy: reason,
    stats: [`${rescued}/${currentLevel.rescue} home`, `${collected}/${dolls.length} plush`, `${Math.ceil(timeLeft)} sec`],
    primaryLabel: "Try again",
    primaryAction: () => startLevel(currentLevelIndex),
    secondaryLabel: "Back to levels",
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
  modal.hidden = false;
}

function hideModal() {
  modal.hidden = true;
  modalPrimaryAction = null;
  modalSecondaryAction = null;
}

function showMenu() {
  running = false;
  paused = false;
  hideModal();
  gameScreen.hidden = true;
  menuScreen.hidden = false;
  document.body.classList.remove("playing");
  updateMenu();
  scrollTo({ top: 0, behavior: "instant" });
}

function togglePause() {
  if (resolving || gameScreen.hidden) return;
  paused = !paused;
  pauseButton.textContent = paused ? "▶" : "Ⅱ";
  pauseButton.setAttribute("aria-label", paused ? "Resume game" : "Pause game");
  showToast(paused ? "Rescue paused" : "Rescue resumed");
  lastFrame = performance.now();
}

function updateSkillDock() {
  skillButtons.forEach((button) => {
    const skill = button.dataset.skill;
    document.getElementById(`skill-${skill}`).textContent = String(skills[skill] || 0);
    button.disabled = !skills[skill];
    button.classList.toggle("selected", selectedSkill === skill);
    button.setAttribute("aria-pressed", selectedSkill === skill ? "true" : "false");
  });
}

function updateHUD() {
  rescueValue.textContent = `${rescued} / ${currentLevel.rescue}`;
  dollValue.textContent = `${collected} / ${dolls.length}`;
  const seconds = Math.max(0, Math.ceil(timeLeft));
  timeValue.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  releaseFill.style.width = `${(spawned / currentLevel.population) * 100}%`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1450);
}

function announce(message) {
  announcer.textContent = "";
  setTimeout(() => { announcer.textContent = message; }, 30);
}

/* --------------------------------------------------------------------------
 * Drawing
 * ----------------------------------------------------------------------- */

function resizeCanvas() {
  const box = gameStage.getBoundingClientRect();
  const density = Math.min(devicePixelRatio || 1, 2);
  viewWidth = Math.max(320, box.width);
  viewHeight = Math.max(240, box.height);
  canvas.width = Math.round(viewWidth * density);
  canvas.height = Math.round(viewHeight * density);
  context.setTransform(density, 0, 0, density, 0, 0);
}

function burst(x, y, color, count) {
  for (let index = 0; index < count; index += 1) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2, life: 1, color });
  }
}

function drawPlush(item, cellWidth, cellHeight, time) {
  const x = item.x * cellWidth;
  const y = (item.y - 0.58) * cellHeight + Math.sin(time * 0.004 + item.bob) * 3;
  const size = Math.min(cellWidth, cellHeight) * 0.72;
  context.save();
  context.translate(x, y);
  if (item.collected) context.globalAlpha = 0.16;
  const colors = { bunny: "#f4d8d0", bear: "#c89167", frog: "#8fd28a", cat: "#ece6df", duck: "#ffd85c", elephant: "#a9b8ce", fox: "#e9985d", penguin: "#66708c", dragon: "#aa8bdd", puppy: "#d6a878", mouse: "#c3b4bd", whale: "#79b9df" };
  context.fillStyle = colors[item.type] || "#ffb4d0";
  context.strokeStyle = "#241a35";
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(0, 0, size * 0.46, size * 0.55, 0, 0, Math.PI * 2);
  context.fill(); context.stroke();
  if (["bunny", "cat", "fox", "mouse"].includes(item.type)) {
    context.beginPath();
    context.ellipse(-size * 0.24, -size * 0.46, size * 0.12, size * (item.type === "bunny" ? 0.32 : 0.2), -0.2, 0, Math.PI * 2);
    context.ellipse(size * 0.24, -size * 0.46, size * 0.12, size * (item.type === "bunny" ? 0.32 : 0.2), 0.2, 0, Math.PI * 2);
    context.fill(); context.stroke();
  }
  context.fillStyle = "#241a35";
  context.beginPath();
  context.arc(-size * 0.14, -size * 0.08, 1.7, 0, Math.PI * 2);
  context.arc(size * 0.14, -size * 0.08, 1.7, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawUnit(unit, cellWidth, cellHeight, time) {
  const x = unit.x * cellWidth;
  const y = unit.y * cellHeight;
  const size = Math.min(cellWidth, cellHeight) * 0.76;
  context.save();
  context.translate(x, y - size * 0.48);
  context.scale(unit.dir, 1);
  const bounce = Math.sin(time * 0.012 + unit.phase) * 1.5;
  context.translate(0, bounce);
  if (selectedSkill) {
    context.strokeStyle = "rgba(255,216,92,0.5)";
    context.lineWidth = 2;
    context.beginPath(); context.arc(0, 0, size * 0.72, 0, Math.PI * 2); context.stroke();
  }
  context.fillStyle = unit.state === "build" ? "#ffd85c" : unit.state === "bash" ? "#ff8fb8" : "#8ce5c3";
  context.strokeStyle = "#241a35";
  context.lineWidth = 2;
  context.beginPath(); context.ellipse(0, 0, size * 0.42, size * 0.52, 0, 0, Math.PI * 2); context.fill(); context.stroke();
  context.fillStyle = "#ff8fb8";
  context.beginPath(); context.ellipse(0, -size * 0.44, size * 0.35, size * 0.16, -0.08, 0, Math.PI * 2); context.fill(); context.stroke();
  context.fillStyle = "#241a35";
  context.beginPath(); context.arc(size * 0.13, -size * 0.08, 1.8, 0, Math.PI * 2); context.fill();
  if (unit.float && unit.state === "fall") {
    context.strokeStyle = "#fff8ec";
    context.beginPath(); context.arc(0, -size * 0.8, size * 0.55, Math.PI, Math.PI * 2); context.stroke();
    context.beginPath(); context.moveTo(0, -size * 0.8); context.lineTo(0, -size * 0.25); context.stroke();
  }
  context.restore();
}

function drawGame(time) {
  const cellWidth = viewWidth / WORLD_WIDTH;
  const cellHeight = viewHeight / WORLD_HEIGHT;
  const theme = THEMES[currentLevel.theme];
  const gradient = context.createLinearGradient(0, 0, 0, viewHeight);
  gradient.addColorStop(0, theme.sky);
  gradient.addColorStop(1, "#160f25");
  context.fillStyle = gradient;
  context.fillRect(0, 0, viewWidth, viewHeight);

  context.fillStyle = "rgba(255,255,255,0.12)";
  for (let index = 0; index < 42; index += 1) {
    const x = ((index * 83) % 997) / 997 * viewWidth;
    const y = ((index * 47) % 541) / 541 * viewHeight * 0.72;
    context.fillRect(x, y, index % 4 === 0 ? 2 : 1, index % 4 === 0 ? 2 : 1);
  }

  hazards.forEach((hazard) => {
    const x = hazard.x * cellWidth;
    const y = hazard.y * cellHeight;
    const width = hazard.width * cellWidth;
    context.fillStyle = hazard.kind === "water" ? "#58bde3" : hazard.kind === "storm" ? "#8d72da" : "#ffcf4d";
    context.globalAlpha = 0.8;
    context.fillRect(x, y, width, viewHeight - y);
    context.globalAlpha = 1;
  });

  for (let row = 0; row < WORLD_HEIGHT; row += 1) {
    for (let column = 0; column < WORLD_WIDTH; column += 1) {
      const tile = tiles[row][column];
      if (!tile) continue;
      const x = column * cellWidth;
      const y = row * cellHeight;
      context.fillStyle = tile === STEEL ? "#8790a8" : theme.soil;
      context.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5);
      if (!isSolid(column, row - 1)) {
        context.fillStyle = tile === STEEL ? "#d5daea" : theme.soilTop;
        context.fillRect(x, y, cellWidth + 0.5, Math.max(3, cellHeight * 0.2));
      }
      context.strokeStyle = "rgba(255,255,255,0.08)";
      context.strokeRect(x + 0.5, y + 0.5, cellWidth - 1, cellHeight - 1);
    }
  }

  const spawn = currentLevel.spawn;
  context.fillStyle = theme.glow;
  context.strokeStyle = "#fff8ec";
  context.lineWidth = 2;
  context.fillRect((spawn.x - 0.65) * cellWidth, (spawn.y - 1.4) * cellHeight, cellWidth * 1.3, cellHeight * 0.8);
  context.strokeRect((spawn.x - 0.65) * cellWidth, (spawn.y - 1.4) * cellHeight, cellWidth * 1.3, cellHeight * 0.8);

  const exit = currentLevel.exit;
  context.fillStyle = "#fff8ec";
  context.strokeStyle = theme.glow;
  context.lineWidth = 3;
  context.fillRect((exit.x - 0.7) * cellWidth, (exit.y - 1.7) * cellHeight, cellWidth * 1.4, cellHeight * 1.7);
  context.strokeRect((exit.x - 0.7) * cellWidth, (exit.y - 1.7) * cellHeight, cellWidth * 1.4, cellHeight * 1.7);
  context.fillStyle = "#241a35";
  context.font = `900 ${Math.max(8, cellHeight * 0.36)}px Arial`;
  context.textAlign = "center";
  context.fillText("HOME", exit.x * cellWidth, (exit.y - 0.72) * cellHeight);

  dolls.forEach((item) => drawPlush(item, cellWidth, cellHeight, time));
  units.filter((unit) => unit.active).forEach((unit) => drawUnit(unit, cellWidth, cellHeight, time));

  particles.forEach((particle) => {
    context.globalAlpha = Math.max(0, particle.life);
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x * cellWidth, particle.y * cellHeight, 2.5, 0, Math.PI * 2);
    context.fill();
  });
  context.globalAlpha = 1;
}

/* --------------------------------------------------------------------------
 * Loop and lifecycle
 * ----------------------------------------------------------------------- */

function gameLoop(time) {
  const rawElapsed = Math.min(0.04, Math.max(0, (time - lastFrame) / 1000));
  lastFrame = time;
  if (running && !paused && !resolving) {
    timeLeft -= rawElapsed;
    const elapsed = selectedSkill ? rawElapsed * 0.28 : rawElapsed;
    spawnClock -= rawElapsed;
    if (spawned < currentLevel.population && spawnClock <= 0) {
      spawnUnit();
      spawnClock = currentLevel.spawnEvery;
    }
    units.forEach((unit) => updateUnit(unit, elapsed));
    particles.forEach((particle) => {
      particle.x += particle.vx * rawElapsed;
      particle.y += particle.vy * rawElapsed;
      particle.vy += 4 * rawElapsed;
      particle.life -= rawElapsed * 1.4;
    });
    particles = particles.filter((particle) => particle.life > 0);

    if (rescued >= currentLevel.rescue && collected === dolls.length) finishLevel();
    else if (timeLeft <= 0) failLevel("Time ran out. Try assigning skills a little earlier.");
    else if (spawned === currentLevel.population && !units.some((unit) => unit.active)) {
      failLevel(collected < dolls.length ? "A plush friend is still waiting somewhere in the level." : "Not enough Lemmies reached home. Try a safer route.");
    }
    updateHUD();
  }
  if (!gameScreen.hidden) drawGame(time);
  animationFrame = requestAnimationFrame(gameLoop);
}

continueButton.addEventListener("click", () => startLevel(Math.min(save.unlocked, LEVELS.length) - 1));
resetButton.addEventListener("click", () => {
  if (!confirm("Reset every unlocked level, score and collected plush friend?")) return;
  save = defaultSave();
  persistSave();
  soundEnabled = true;
  updateSoundButton();
  updateMenu();
});
menuButton.addEventListener("click", showMenu);
restartButton.addEventListener("click", () => startLevel(currentLevelIndex));
pauseButton.addEventListener("click", togglePause);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  save.sound = soundEnabled;
  persistSave();
  updateSoundButton();
});
modalPrimary.addEventListener("click", () => modalPrimaryAction?.());
modalSecondary.addEventListener("click", () => modalSecondaryAction?.());
window.addEventListener("resize", resizeCanvas, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden && running && !paused) togglePause();
});
window.addEventListener("online", () => {
  offlineBadge.textContent = "Ready offline";
  offlineBadge.classList.remove("offline");
});
window.addEventListener("offline", () => {
  offlineBadge.textContent = "Playing offline";
  offlineBadge.classList.add("offline");
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

offlineBadge.textContent = navigator.onLine ? "Ready offline" : "Playing offline";
offlineBadge.classList.toggle("offline", !navigator.onLine);
updateSoundButton();
updateMenu();
animationFrame = requestAnimationFrame(gameLoop);
window.addEventListener("pagehide", () => cancelAnimationFrame(animationFrame));
