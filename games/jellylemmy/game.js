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

// High-resolution character art is drawn onto the canvas at runtime. Keeping
// it as a real RGBA asset gives the tiny explorers proper hair, fabric, skin
// and boot materials while the canvas still controls movement and effects.
const lemmySprite = new Image();
lemmySprite.decoding = "async";
lemmySprite.src = "./assets/lemmy-explorer.png?v=7";

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
    subtitle: "The museum after dark",
    theme: "plum",
    population: 12, rescue: 10, time: 80, spawnEvery: 1.05, speed: 2.08,
    skills: { turn: 5, build: 7, dig: 4, bash: 5, float: 6 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 30, y: 10 },
    terrain: [platform(0, 16, 11), platform(11, 11, 2, 5), platform(16, 16, 6), platform(25, 10, 7, 8), platform(21, 13, 2, 3, STEEL)],
    hazards: [{ x: 13, y: 17, width: 3, kind: "stars" }, { x: 23, y: 17, width: 2, kind: "stars" }],
    dolls: [doll(7, 16, 11), doll(12, 11, 0), doll(18, 16, 1), doll(26, 10, 2), doll(30, 10, 8)],
    tip: "Use everything you learned. The rare Pocket Dragon is waiting.",
  },
  {
    name: "Clockwork Cuddles",
    subtitle: "Beat the attic clock",
    theme: "gold",
    population: 12, rescue: 10, time: 78, spawnEvery: 1, speed: 2.12,
    skills: { turn: 5, build: 4, dig: 2, bash: 7, float: 2 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 30, y: 16 },
    terrain: [platform(0, 16, 32), platform(9, 10, 2, 6), platform(18, 12, 2, 4), platform(24, 13, 2, 3, STEEL)],
    hazards: [], dolls: [doll(6, 16, 12), doll(14, 16, 13), doll(22, 16, 14), doll(28, 16, 15)],
    tip: "Bash the soft clockwork walls, but build over the silver gears.",
  },
  {
    name: "Jellybean Junction",
    subtitle: "Choose the right floor",
    theme: "rose",
    population: 13, rescue: 10, time: 76, spawnEvery: 0.96, speed: 2.16,
    skills: { turn: 6, build: 3, dig: 6, bash: 4, float: 3 },
    spawn: { x: 3, y: 2, dir: 1 }, exit: { x: 2, y: 16 },
    terrain: [platform(0, 7, 32, 1), platform(0, 16, 32), platform(12, 11, 2, 5, STEEL), platform(22, 12, 2, 4)],
    hazards: [], dolls: [doll(8, 7, 16), doll(26, 7, 17), doll(7, 16, 18), doll(18, 16, 19), doll(28, 16, 20)],
    tip: "Explore upstairs, then dig before the steel divider and turn everyone home.",
  },
  {
    name: "Starlight Spillway",
    subtitle: "Bridge the glowing river",
    theme: "blue",
    population: 13, rescue: 11, time: 74, spawnEvery: 0.92, speed: 2.2,
    skills: { turn: 6, build: 9, dig: 2, bash: 2, float: 5 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 30, y: 9 },
    terrain: [platform(0, 10, 8, 1), platform(10, 16, 7), platform(19, 12, 6, 6), platform(27, 9, 5, 9)],
    hazards: [{ x: 8, y: 17, width: 2, kind: "stars" }, { x: 17, y: 17, width: 2, kind: "water" }, { x: 25, y: 17, width: 2, kind: "stars" }],
    dolls: [doll(5, 10, 21), doll(13, 16, 22), doll(22, 12, 23), doll(29, 9, 24)],
    tip: "Three gaps, three heights. Float first, then build each shining crossing.",
  },
  {
    name: "Cuckoo Clock Tower",
    subtitle: "Race up the chiming shelves",
    theme: "plum",
    population: 14, rescue: 11, time: 72, spawnEvery: 0.88, speed: 2.24,
    skills: { turn: 7, build: 10, dig: 3, bash: 3, float: 4 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 29, y: 6 },
    terrain: [platform(0, 16, 8), platform(10, 13, 6, 5), platform(18, 10, 6, 8), platform(26, 6, 6, 12), platform(15, 15, 1, 1, STEEL)],
    hazards: [{ x: 8, y: 17, width: 2, kind: "storm" }, { x: 16, y: 17, width: 2, kind: "storm" }, { x: 24, y: 17, width: 2, kind: "storm" }],
    dolls: [doll(5, 16, 25), doll(13, 13, 26), doll(21, 10, 27), doll(29, 6, 28)],
    tip: "Climb fast: each bridge must start near the very edge of its shelf.",
  },
  {
    name: "Frosted Toy Fortress",
    subtitle: "Soft cake, solid silver",
    theme: "mint",
    population: 14, rescue: 12, time: 70, spawnEvery: 0.84, speed: 2.28,
    skills: { turn: 7, build: 7, dig: 5, bash: 7, float: 4 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 30, y: 16 },
    terrain: [platform(0, 16, 32), platform(8, 11, 2, 5), platform(14, 12, 2, 4, STEEL), platform(20, 9, 2, 7), platform(26, 13, 2, 3, STEEL)],
    hazards: [], dolls: [doll(5, 16, 29), doll(12, 16, 30), doll(18, 16, 31), doll(24, 16, 32), doll(29, 16, 33)],
    tip: "Read each wall: bash the cake, build over silver, and keep the troop together.",
  },
  {
    name: "Pocket Dragon Dream",
    subtitle: "Float through a sleepy sky",
    theme: "blue",
    population: 15, rescue: 12, time: 68, spawnEvery: 0.8, speed: 2.32,
    skills: { turn: 8, build: 8, dig: 4, bash: 4, float: 12 },
    spawn: { x: 2, y: 2, dir: 1 }, exit: { x: 30, y: 16 },
    terrain: [platform(0, 6, 9, 1), platform(12, 11, 7, 1), platform(22, 8, 6, 1), platform(17, 16, 15)],
    hazards: [{ x: 9, y: 17, width: 3, kind: "stars" }, { x: 19, y: 17, width: 3, kind: "stars" }, { x: 28, y: 17, width: 3, kind: "storm" }],
    dolls: [doll(5, 6, 34), doll(15, 11, 35), doll(25, 8, 36), doll(20, 16, 37), doll(29, 16, 38)],
    tip: "Float across the dream shelves, then dig or build toward the moonlit home.",
  },
  {
    name: "Plush Planet",
    subtitle: "Orbit every tiny moon",
    theme: "gold",
    population: 15, rescue: 13, time: 66, spawnEvery: 0.76, speed: 2.36,
    skills: { turn: 9, build: 11, dig: 6, bash: 6, float: 8 },
    spawn: { x: 2, y: 3, dir: 1 }, exit: { x: 2, y: 16 },
    terrain: [platform(0, 8, 11, 1), platform(14, 6, 8, 1), platform(25, 9, 7, 1), platform(0, 16, 9), platform(12, 13, 8, 5), platform(23, 16, 9)],
    hazards: [{ x: 9, y: 17, width: 3, kind: "stars" }, { x: 20, y: 17, width: 3, kind: "stars" }],
    dolls: [doll(6, 8, 39), doll(18, 6, 40), doll(28, 9, 41), doll(16, 13, 42), doll(27, 16, 43), doll(5, 16, 44)],
    tip: "Collect every orbiting plush, descend carefully, then reverse course for home.",
  },
  {
    name: "Crown of Cuddles",
    subtitle: "The ultimate plush rescue",
    theme: "plum",
    population: 16, rescue: 14, time: 64, spawnEvery: 0.72, speed: 2.4,
    skills: { turn: 10, build: 12, dig: 7, bash: 8, float: 10 },
    spawn: { x: 2, y: 2, dir: 1 }, exit: { x: 30, y: 7 },
    terrain: [platform(0, 7, 10, 1), platform(0, 16, 7), platform(10, 13, 6, 5), platform(18, 16, 6), platform(26, 7, 6, 11), platform(15, 11, 2, 2, STEEL), platform(23, 12, 2, 4)],
    hazards: [{ x: 7, y: 17, width: 3, kind: "storm" }, { x: 16, y: 17, width: 2, kind: "stars" }, { x: 24, y: 17, width: 2, kind: "water" }],
    dolls: [doll(6, 7, 45), doll(4, 16, 46), doll(13, 13, 47), doll(21, 16, 48), doll(24, 12, 49), doll(28, 7, 50), doll(30, 7, 51)],
    tip: "The crown demands every skill. Rescue fourteen Lemmies and every royal plush.",
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
const musicTitle = document.getElementById("music-title");
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

// Players who finished the original twelve-level adventure start directly at
// the first new world instead of having to replay the old finale.
if (save.unlocked === 12 && Number(save.stars?.[11] || 0) > 0) {
  save.unlocked = 13;
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

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
    button.dataset.theme = level.theme;
    button.disabled = !unlocked;
    button.setAttribute("aria-label", `${unlocked ? "Play" : "Locked"} level ${index + 1}: ${level.name}`);
    button.innerHTML = `<span>Mission ${String(index + 1).padStart(2, "0")}</span><i class="stars">${unlocked ? `${"★".repeat(stars)}${"☆".repeat(3 - stars)}` : "◆"}</i><strong>${level.name}</strong><em>♫ ${MUSIC[index].title}</em><small>${level.dolls.length} plush</small>`;
    button.addEventListener("click", () => startLevel(index));
    levelGrid.appendChild(button);
  });
}

/* --------------------------------------------------------------------------
 * Sound
 * ----------------------------------------------------------------------- */

let audioContext = null;
let soundEnabled = save.sound !== false;
let musicTimer = 0;
let musicStep = 0;
let musicGeneration = 0;

// Twenty original, tiny synth scores. Keeping the notes in code means the
// complete soundtrack works on an aeroplane just like the rest of the game.
const MUSIC = [
  { title: "Plush Parade Waltz", bpm: 104, wave: "triangle", melody: [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84], bass: [48, 55, 52] },
  { title: "Steps in the Clouds", bpm: 112, wave: "sine", melody: [67, 71, 74, 79, 76, 74, 71, 74, 79, 83, 81, 79], bass: [43, 50, 47] },
  { title: "Burrow Bossa", bpm: 116, wave: "triangle", melody: [64, 67, 71, 74, 71, 67, 66, 69, 72, 76, 72, 69], bass: [40, 47, 45] },
  { title: "Cuddle Cloud Lullaby", bpm: 90, wave: "sine", melody: [76, 79, 83, null, 81, 79, 76, null, 74, 76, 79, 83], bass: [45, 52, 48] },
  { title: "Tea-Shop Tiptoe", bpm: 120, wave: "triangle", melody: [69, 72, 76, 72, 71, 74, 77, 74, 69, 72, 76, 81], bass: [45, 52, 50] },
  { title: "Two-Storey Tango", bpm: 124, wave: "square", melody: [62, 65, 69, 70, 69, 65, 62, 67, 70, 74, 72, 70], bass: [38, 45, 43] },
  { title: "Bubble Bridge Bounce", bpm: 128, wave: "sine", melody: [74, 78, 81, 86, 83, 81, 78, 81, 86, 90, 88, 86], bass: [47, 54, 51] },
  { title: "Moon-Shelf Minuet", bpm: 108, wave: "triangle", melody: [69, 73, 76, 81, 80, 76, 73, 68, 71, 76, 80, 83], bass: [45, 52, 44] },
  { title: "Tin Toy Toccata", bpm: 132, wave: "square", melody: [64, 68, 71, 76, 71, 68, 66, 69, 73, 78, 73, 69], bass: [40, 47, 42] },
  { title: "Nursery Thunder", bpm: 118, wave: "sawtooth", melody: [62, 65, 69, 74, 72, 69, 65, 60, 64, 67, 72, 76], bass: [38, 45, 36] },
  { title: "The Great Plush Chase", bpm: 136, wave: "triangle", melody: [67, 70, 74, 79, 77, 74, 70, 72, 75, 79, 82, 79], bass: [43, 50, 46] },
  { title: "Midnight Museum", bpm: 110, wave: "sine", melody: [61, 64, 68, 73, 71, 68, 64, 59, 63, 66, 71, 75], bass: [37, 44, 35] },
  { title: "Clockwork Cuddle", bpm: 140, wave: "square", melody: [72, 76, 79, 84, 83, 79, 76, 71, 74, 79, 83, 86], bass: [48, 55, 47] },
  { title: "Jellybean Junction", bpm: 126, wave: "triangle", melody: [65, 69, 72, 77, 74, 72, 69, 67, 70, 74, 79, 82], bass: [41, 48, 43] },
  { title: "Starlight River", bpm: 130, wave: "sine", melody: [78, 81, 85, 90, 88, 85, 81, 76, 80, 83, 88, 92], bass: [42, 49, 44] },
  { title: "Cuckoo Clock Sprint", bpm: 144, wave: "square", melody: [67, 72, 76, 79, 76, 72, 67, 71, 74, 79, 83, 86], bass: [43, 50, 47] },
  { title: "Fortress Frost", bpm: 134, wave: "sawtooth", melody: [60, 63, 67, 72, 70, 67, 63, 58, 62, 65, 70, 74], bass: [36, 43, 34] },
  { title: "Pocket Dragon Dreams", bpm: 114, wave: "sine", melody: [74, 79, 83, 86, 88, 86, 83, 79, 76, 81, 84, 88], bass: [43, 50, 45] },
  { title: "Orbit of the Plush", bpm: 142, wave: "triangle", melody: [69, 73, 76, 81, 85, 81, 76, 71, 74, 78, 83, 86], bass: [45, 52, 47] },
  { title: "Crown of Cuddles", bpm: 148, wave: "square", melody: [72, 76, 79, 84, 88, 86, 83, 79, 74, 77, 81, 86], bass: [48, 55, 50] },
];

function ensureAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!audioContext && AudioContextClass) audioContext = new AudioContextClass();
  if (audioContext?.state === "suspended") audioContext.resume();
  return audioContext;
}

function tone(frequency, duration = 0.08, delay = 0, type = "sine", volume = 0.03) {
  if (!soundEnabled) return;
  if (!ensureAudio()) return;
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

function midiFrequency(note) {
  return 440 * (2 ** ((note - 69) / 12));
}

function stopLevelMusic() {
  musicGeneration += 1;
  clearTimeout(musicTimer);
  musicTimer = 0;
}

function startLevelMusic(delay = 0.45) {
  stopLevelMusic();
  if (!soundEnabled || !running || paused || gameScreen.hidden) return;
  if (!ensureAudio()) return;
  const track = MUSIC[currentLevelIndex];
  const generation = musicGeneration;
  musicStep = 0;

  const playBeat = () => {
    if (generation !== musicGeneration || !soundEnabled || !running || paused || gameScreen.hidden) return;
    const melodyNote = track.melody[musicStep % track.melody.length];
    const beatLength = 60 / track.bpm / 2;
    if (melodyNote) tone(midiFrequency(melodyNote), beatLength * 0.72, 0, track.wave, 0.012);
    if (musicStep % 4 === 0) {
      const bassNote = track.bass[Math.floor(musicStep / 4) % track.bass.length];
      tone(midiFrequency(bassNote), beatLength * 2.6, 0, "sine", 0.014);
    }
    if (musicStep % 8 === 6) tone(midiFrequency(melodyNote - 12), beatLength * 0.45, 0, "triangle", 0.006);
    musicStep += 1;
    musicTimer = window.setTimeout(playBeat, beatLength * 1000);
  };

  musicTimer = window.setTimeout(playBeat, delay * 1000);
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
  musicTitle.textContent = `♫ ${MUSIC[currentLevelIndex].title}`;
  tapHint.classList.remove("dismissed");
  updateSkillDock();
  updateHUD();
  resizeCanvas();
  playSound("start");
  startLevelMusic();
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
  stopLevelMusic();
  playSound("win");
  showModal({
    sticker: stars === 3 ? "✦" : "♥",
    kicker: `Level ${currentLevelIndex + 1} complete · ${"★".repeat(stars)}`,
    title: "The plush friends are safe!",
    copy: currentLevelIndex === LEVELS.length - 1
      ? "The Crown of Cuddles is glowing. You mastered all twenty rescues and brought every royal plush home."
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
  stopLevelMusic();
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
  stopLevelMusic();
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
  if (paused) stopLevelMusic();
  else startLevelMusic(0.08);
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

function roundedPath(x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.arcTo(x + width, y, x + width, y + height, corner);
  context.arcTo(x + width, y + height, x, y + height, corner);
  context.arcTo(x, y + height, x, y, corner);
  context.arcTo(x, y, x + width, y, corner);
  context.closePath();
}

function drawPlush(item, cellWidth, cellHeight, time) {
  const x = item.x * cellWidth;
  const ground = item.y * cellHeight;
  const bob = Math.sin(time * 0.004 + item.bob) * 2.8;
  const cellSize = Math.min(cellWidth, cellHeight);
  const size = cellSize * (cellSize < 18 ? 1.68 : 1.42);
  const colors = {
    bunny: ["#fff7ef", "#eacdc5"], bear: ["#dbad82", "#9b6548"], frog: ["#a8ed91", "#56a968"],
    cat: ["#fffaf1", "#cfc4bd"], duck: ["#ffe77a", "#e5a834"], elephant: ["#c5d1e2", "#7d8fae"],
    fox: ["#ffad6b", "#c75e42"], penguin: ["#7989a9", "#35405d"], dragon: ["#c49cff", "#7756b7"],
    puppy: ["#e6bd8b", "#a86e4f"], mouse: ["#d8cad2", "#998796"], whale: ["#8ed6f5", "#4b91bb"],
  };
  const [light, dark] = colors[item.type] || ["#ffb4d0", "#d76d9b"];
  const outline = "#2b2039";

  context.save();
  if (item.collected) context.globalAlpha = 0.12;

  // A grounded shadow and a restrained halo make the toy feel present in the
  // world instead of looking like an icon floating over it.
  context.fillStyle = "rgba(3,1,12,0.4)";
  context.beginPath();
  context.ellipse(x, ground - size * 0.03, size * 0.38, size * 0.1, 0, 0, Math.PI * 2);
  context.fill();
  context.translate(x, ground - size * 0.54 + bob);
  context.shadowColor = light;
  context.shadowBlur = size * 0.5;
  context.fillStyle = "rgba(255,255,255,0.1)";
  context.beginPath();
  context.arc(0, 0, size * 0.66, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;

  const fur = context.createRadialGradient(-size * 0.18, -size * 0.32, size * 0.03, 0, 0, size * 0.7);
  fur.addColorStop(0, light);
  fur.addColorStop(0.58, light);
  fur.addColorStop(1, dark);
  context.fillStyle = fur;
  context.strokeStyle = outline;
  context.lineWidth = Math.max(1.15, size * 0.045);
  context.lineJoin = "round";
  context.lineCap = "round";

  // Stuffed legs and arms sit behind the torso. Their slight asymmetry and
  // stitched ends make each collectible read as a real soft toy.
  context.save();
  context.rotate(-0.08);
  roundedPath(-size * 0.28, size * 0.24, size * 0.22, size * 0.42, size * 0.11);
  context.fill(); context.stroke();
  context.restore();
  context.save();
  context.rotate(0.08);
  roundedPath(size * 0.06, size * 0.24, size * 0.22, size * 0.42, size * 0.11);
  context.fill(); context.stroke();
  context.restore();
  context.save();
  context.rotate(-0.42);
  roundedPath(-size * 0.43, -size * 0.03, size * 0.19, size * 0.42, size * 0.1);
  context.fill(); context.stroke();
  context.restore();
  context.save();
  context.rotate(0.42);
  roundedPath(size * 0.24, -size * 0.03, size * 0.19, size * 0.42, size * 0.1);
  context.fill(); context.stroke();
  context.restore();

  // Tail and wings are tucked behind the body.
  if (["cat", "fox", "mouse", "puppy"].includes(item.type)) {
    context.beginPath();
    context.moveTo(size * 0.25, size * 0.19);
    context.bezierCurveTo(size * 0.68, size * 0.12, size * 0.55, size * 0.48, size * 0.34, size * 0.39);
    context.strokeStyle = dark;
    context.lineWidth = size * 0.15;
    context.stroke();
    context.strokeStyle = outline;
    context.lineWidth = Math.max(1, size * 0.035);
  } else if (item.type === "dragon") {
    context.beginPath();
    context.moveTo(-size * 0.28, -size * 0.02); context.lineTo(-size * 0.58, -size * 0.2); context.lineTo(-size * 0.5, size * 0.18); context.closePath();
    context.moveTo(size * 0.28, -size * 0.02); context.lineTo(size * 0.58, -size * 0.2); context.lineTo(size * 0.5, size * 0.18); context.closePath();
    context.fill(); context.stroke();
  }

  // Pear-shaped stuffed torso.
  context.fillStyle = fur;
  context.strokeStyle = outline;
  context.beginPath();
  context.ellipse(0, size * 0.14, size * 0.36, size * 0.42, 0, 0, Math.PI * 2);
  context.fill(); context.stroke();

  // Species-specific ears create a recognisable silhouette before the head is
  // added, while keeping the same premium plush construction language.
  if (item.type === "bunny") {
    context.beginPath();
    context.ellipse(-size * 0.2, -size * 0.55, size * 0.12, size * 0.32, -0.14, 0, Math.PI * 2);
    context.ellipse(size * 0.2, -size * 0.55, size * 0.12, size * 0.32, 0.14, 0, Math.PI * 2);
    context.fill(); context.stroke();
  } else if (["cat", "fox", "mouse"].includes(item.type)) {
    context.beginPath();
    context.moveTo(-size * 0.42, -size * 0.3); context.lineTo(-size * 0.28, -size * 0.62); context.lineTo(-size * 0.06, -size * 0.39);
    context.moveTo(size * 0.42, -size * 0.3); context.lineTo(size * 0.28, -size * 0.62); context.lineTo(size * 0.06, -size * 0.39);
    context.fill(); context.stroke();
  } else if (["bear", "puppy"].includes(item.type)) {
    context.beginPath();
    context.arc(-size * 0.3, -size * 0.35, size * 0.17, 0, Math.PI * 2);
    context.arc(size * 0.3, -size * 0.35, size * 0.17, 0, Math.PI * 2);
    context.fill(); context.stroke();
  } else if (item.type === "frog") {
    context.beginPath();
    context.arc(-size * 0.24, -size * 0.38, size * 0.15, 0, Math.PI * 2);
    context.arc(size * 0.24, -size * 0.38, size * 0.15, 0, Math.PI * 2);
    context.fill(); context.stroke();
  } else if (item.type === "dragon") {
    context.beginPath();
    context.moveTo(-size * 0.34, -size * 0.35); context.lineTo(-size * 0.46, -size * 0.68); context.lineTo(-size * 0.12, -size * 0.43);
    context.moveTo(size * 0.34, -size * 0.35); context.lineTo(size * 0.46, -size * 0.68); context.lineTo(size * 0.12, -size * 0.43);
    context.fill(); context.stroke();
  } else if (item.type === "elephant") {
    context.beginPath();
    context.ellipse(-size * 0.38, -size * 0.23, size * 0.2, size * 0.27, -0.3, 0, Math.PI * 2);
    context.ellipse(size * 0.38, -size * 0.23, size * 0.2, size * 0.27, 0.3, 0, Math.PI * 2);
    context.fill(); context.stroke();
  } else if (item.type === "duck") {
    context.beginPath();
    context.moveTo(-size * 0.12, -size * 0.49); context.lineTo(0, -size * 0.7); context.lineTo(size * 0.11, -size * 0.48);
    context.fill(); context.stroke();
  }

  // Separate oversized head, like a contemporary designer plush.
  context.beginPath();
  context.ellipse(0, -size * 0.25, size * 0.43, size * 0.36, 0, 0, Math.PI * 2);
  context.fill(); context.stroke();

  if (item.type === "elephant") {
    context.beginPath();
    context.moveTo(size * 0.02, -size * 0.18);
    context.quadraticCurveTo(size * 0.17, size * 0.1, size * 0.02, size * 0.2);
    context.lineWidth = size * 0.12;
    context.stroke();
  } else if (item.type === "duck") {
    context.fillStyle = "#f39a43";
    context.strokeStyle = outline;
    context.beginPath();
    context.ellipse(0, -size * 0.17, size * 0.19, size * 0.1, 0, 0, Math.PI * 2);
    context.fill(); context.stroke();
  } else if (item.type === "penguin") {
    context.fillStyle = "#f8f3eb";
    context.beginPath();
    context.ellipse(0, -size * 0.23, size * 0.29, size * 0.25, 0, 0, Math.PI * 2);
    context.fill();
  }

  // Glass bead eyes, a felt nose, blush and a short stitched smile.
  context.fillStyle = outline;
  context.beginPath();
  context.arc(-size * 0.14, -size * 0.29, size * 0.047, 0, Math.PI * 2);
  context.arc(size * 0.14, -size * 0.29, size * 0.047, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.86)";
  context.beginPath();
  context.arc(-size * 0.126, -size * 0.305, size * 0.014, 0, Math.PI * 2);
  context.arc(size * 0.154, -size * 0.305, size * 0.014, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,122,153,0.34)";
  context.beginPath();
  context.ellipse(-size * 0.25, -size * 0.18, size * 0.08, size * 0.04, 0, 0, Math.PI * 2);
  context.ellipse(size * 0.25, -size * 0.18, size * 0.08, size * 0.04, 0, 0, Math.PI * 2);
  context.fill();
  if (!["duck", "elephant"].includes(item.type)) {
    context.fillStyle = item.type === "frog" ? "#315d43" : "#6d4651";
    context.beginPath(); context.arc(0, -size * 0.2, size * 0.045, 0, Math.PI * 2); context.fill();
  }
  context.strokeStyle = "rgba(43,32,57,0.75)";
  context.lineWidth = Math.max(1, size * 0.028);
  context.beginPath();
  context.arc(0, -size * 0.16, size * 0.1, 0.2, Math.PI - 0.2);
  context.stroke();

  // Visible seam and tiny fabric fibres add tactile detail without using
  // external image assets.
  context.strokeStyle = "rgba(255,255,255,0.45)";
  context.lineWidth = Math.max(0.8, size * 0.018);
  context.setLineDash([size * 0.045, size * 0.04]);
  context.beginPath();
  context.moveTo(0, size * 0.02); context.quadraticCurveTo(-size * 0.04, size * 0.28, 0, size * 0.47);
  context.stroke();
  context.setLineDash([]);
  context.strokeStyle = "rgba(255,255,255,0.26)";
  for (let fibre = 0; fibre < 7; fibre += 1) {
    const angle = fibre * 2.399 + item.bob;
    const radius = size * (0.16 + (fibre % 3) * 0.07);
    const fx = Math.cos(angle) * radius;
    const fy = size * 0.12 + Math.sin(angle) * radius * 0.85;
    context.beginPath(); context.moveTo(fx - 1.5, fy); context.lineTo(fx + 1.5, fy - 1); context.stroke();
  }
  context.restore();
}

function drawUnitFallback(unit, cellWidth, cellHeight, time) {
  const x = unit.x * cellWidth;
  const y = unit.y * cellHeight;
  const cellSize = Math.min(cellWidth, cellHeight);
  const size = cellSize * (cellSize < 18 ? 1.68 : 1.4);
  const stride = Math.sin(time * 0.014 + unit.phase);
  const falling = unit.state === "fall";
  const actionColor = unit.state === "build" ? "#ffd65d" : unit.state === "bash" ? "#ff70b3" : "#62e5bd";
  const outline = "#1c1530";

  context.save();
  context.translate(x, y);
  context.fillStyle = "rgba(3,1,12,0.36)";
  context.beginPath();
  context.ellipse(0, -size * 0.015, size * 0.4, size * 0.09, 0, 0, Math.PI * 2);
  context.fill();
  context.translate(0, -size * 0.58 + (falling ? 0 : stride * 1.1));
  context.scale(unit.dir, 1);

  if (selectedSkill) {
    context.strokeStyle = `rgba(255,216,92,${0.38 + Math.sin(time * 0.01) * 0.15})`;
    context.lineWidth = 2;
    context.setLineDash([4, 4]);
    context.beginPath(); context.arc(0, 0, size * 0.72, 0, Math.PI * 2); context.stroke();
    context.setLineDash([]);
  }

  // Two fully articulated legs: hips, knees and boots remain readable even on
  // a phone. Falling Lemmies kick outward; walkers alternate each stride.
  const leftFootX = falling ? -size * 0.32 : -size * 0.16 + stride * size * 0.14;
  const rightFootX = falling ? size * 0.32 : size * 0.16 - stride * size * 0.14;
  const leftKneeX = -size * 0.12 + stride * size * 0.06;
  const rightKneeX = size * 0.12 - stride * size * 0.06;
  const bootTilt = falling ? 0.45 : stride * 0.28;

  context.strokeStyle = "#ffd5b5";
  context.lineWidth = Math.max(3.2, size * 0.12);
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-size * 0.11, size * 0.2);
  context.lineTo(leftKneeX, size * 0.37);
  context.lineTo(leftFootX, size * 0.52);
  context.moveTo(size * 0.11, size * 0.2);
  context.lineTo(rightKneeX, size * 0.37);
  context.lineTo(rightFootX, size * 0.52);
  context.stroke();

  // A small pair of shorts keeps the two legs visually separate from the
  // tunic while still reading clearly at one-cell character scale.
  context.fillStyle = "#2f4abb";
  context.strokeStyle = outline;
  context.lineWidth = Math.max(1, size * 0.04);
  roundedPath(-size * 0.22, size * 0.16, size * 0.2, size * 0.17, size * 0.05);
  context.fill(); context.stroke();
  roundedPath(size * 0.02, size * 0.16, size * 0.2, size * 0.17, size * 0.05);
  context.fill(); context.stroke();

  context.fillStyle = "#18142b";
  context.strokeStyle = outline;
  context.lineWidth = Math.max(1, size * 0.045);
  context.save();
  context.translate(leftFootX + size * 0.04, size * 0.53);
  context.rotate(bootTilt);
  context.beginPath(); context.ellipse(0, 0, size * 0.17, size * 0.085, 0, 0, Math.PI * 2); context.fill(); context.stroke();
  context.restore();
  context.save();
  context.translate(rightFootX + size * 0.04, size * 0.53);
  context.rotate(-bootTilt);
  context.beginPath(); context.ellipse(0, 0, size * 0.17, size * 0.085, 0, 0, Math.PI * 2); context.fill(); context.stroke();
  context.restore();

  // Swinging arms with visible hands and action-specific poses.
  const armSwing = falling ? 0 : stride * size * 0.11;
  const frontHandX = unit.state === "bash" ? size * 0.57 : size * 0.39 - armSwing;
  const frontHandY = unit.state === "build" ? -size * 0.16 : size * 0.13;
  const backHandX = -size * 0.38 + armSwing;
  const backHandY = falling ? -size * 0.08 : size * 0.13;
  context.strokeStyle = "#4969dc";
  context.lineWidth = Math.max(2.4, size * 0.09);
  context.beginPath();
  context.moveTo(-size * 0.25, -size * 0.01); context.lineTo(backHandX, backHandY);
  context.moveTo(size * 0.25, -size * 0.01); context.lineTo(frontHandX, frontHandY);
  context.stroke();
  context.fillStyle = "#ffd5b5";
  context.strokeStyle = outline;
  context.lineWidth = Math.max(1, size * 0.04);
  context.beginPath();
  context.arc(backHandX, backHandY, size * 0.075, 0, Math.PI * 2);
  context.arc(frontHandX, frontHandY, size * 0.075, 0, Math.PI * 2);
  context.fill(); context.stroke();

  // Blue tunic and belt create a recognisable little person, not a bean.
  const body = context.createLinearGradient(-size * 0.28, -size * 0.18, size * 0.3, size * 0.3);
  body.addColorStop(0, "#7895ff");
  body.addColorStop(0.55, "#4263d8");
  body.addColorStop(1, "#243c9f");
  context.shadowColor = actionColor;
  context.shadowBlur = unit.state === "walk" ? 5 : 11;
  context.fillStyle = body;
  context.strokeStyle = outline;
  context.lineWidth = Math.max(1.5, size * 0.065);
  roundedPath(-size * 0.3, -size * 0.13, size * 0.6, size * 0.45, size * 0.17);
  context.fill(); context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = actionColor;
  roundedPath(-size * 0.3, size * 0.12, size * 0.6, size * 0.09, size * 0.04);
  context.fill();

  // Separate head and face.
  const skin = context.createRadialGradient(-size * 0.1, -size * 0.37, 1, 0, -size * 0.29, size * 0.32);
  skin.addColorStop(0, "#fff0d6");
  skin.addColorStop(1, "#eeb990");
  context.fillStyle = skin;
  context.strokeStyle = outline;
  context.lineWidth = Math.max(1.4, size * 0.055);
  context.beginPath();
  context.arc(0, -size * 0.3, size * 0.265, 0, Math.PI * 2);
  context.fill(); context.stroke();

  // Wild green hair gives the walkers their unmistakable Lemmy silhouette.
  const hair = context.createLinearGradient(0, -size * 0.72, 0, -size * 0.38);
  hair.addColorStop(0, "#a5ff80");
  hair.addColorStop(1, "#35c77b");
  context.fillStyle = hair;
  context.beginPath();
  context.moveTo(-size * 0.26, -size * 0.34);
  context.quadraticCurveTo(-size * 0.37, -size * 0.61, -size * 0.13, -size * 0.52);
  context.quadraticCurveTo(-size * 0.04, -size * 0.75, size * 0.07, -size * 0.53);
  context.quadraticCurveTo(size * 0.22, -size * 0.7, size * 0.27, -size * 0.39);
  context.closePath();
  context.fill(); context.stroke();

  context.fillStyle = outline;
  context.beginPath(); context.arc(size * 0.1, -size * 0.32, size * 0.04, 0, Math.PI * 2); context.fill();
  context.strokeStyle = outline;
  context.lineWidth = Math.max(1, size * 0.04);
  context.beginPath(); context.arc(size * 0.11, -size * 0.23, size * 0.1, 0.25, 1.55); context.stroke();

  if (unit.state === "build") {
    context.fillStyle = "#f6c64f";
    context.strokeStyle = outline;
    context.beginPath();
    context.rect(size * 0.38, -size * 0.29, size * 0.2, size * 0.1);
    context.fill(); context.stroke();
  }

  if (unit.float && unit.state === "fall") {
    const umbrella = context.createLinearGradient(0, -size * 1.3, 0, -size * 0.78);
    umbrella.addColorStop(0, "#fff29a");
    umbrella.addColorStop(1, "#ff78b7");
    context.fillStyle = umbrella;
    context.strokeStyle = "#fff";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(0, -size * 0.9, size * 0.58, Math.PI, Math.PI * 2);
    context.quadraticCurveTo(size * 0.3, -size * 0.78, 0, -size * 0.9);
    context.quadraticCurveTo(-size * 0.3, -size * 0.78, -size * 0.58, -size * 0.9);
    context.fill(); context.stroke();
    context.beginPath(); context.moveTo(0, -size * 0.9); context.lineTo(0, -size * 0.27); context.stroke();
  }
  context.restore();
}

function drawUnit(unit, cellWidth, cellHeight, time) {
  if (!lemmySprite.complete || !lemmySprite.naturalWidth) {
    drawUnitFallback(unit, cellWidth, cellHeight, time);
    return;
  }

  const x = unit.x * cellWidth;
  const ground = unit.y * cellHeight;
  const cellSize = Math.min(cellWidth, cellHeight);
  const compact = cellSize < 18;
  const height = cellSize * (compact ? 3.15 : 2.6);
  const width = height * (lemmySprite.naturalWidth / lemmySprite.naturalHeight);
  const stride = Math.sin(time * 0.012 + unit.phase);
  const walking = unit.state === "walk";
  const falling = unit.state === "fall";
  const bob = walking ? -Math.abs(stride) * height * 0.025 : 0;
  const lean = falling ? -unit.dir * 0.13 : walking ? stride * 0.025 : unit.state === "bash" ? 0.1 : 0;
  const actionColor = unit.state === "build" ? "#ffd55e" : unit.state === "bash" ? "#ff65af" : "#67f0c5";

  context.save();

  // Soft contact shadow changes shape as a Lemmy leaves the ground.
  context.fillStyle = falling ? "rgba(4,2,14,0.16)" : "rgba(4,2,14,0.45)";
  context.beginPath();
  context.ellipse(x, ground - cellSize * 0.03, width * (falling ? 0.24 : 0.34), cellSize * 0.11, 0, 0, Math.PI * 2);
  context.fill();

  if (selectedSkill) {
    const selectPulse = 0.52 + Math.sin(time * 0.009) * 0.16;
    context.strokeStyle = `rgba(255,224,112,${selectPulse})`;
    context.lineWidth = compact ? 1.4 : 2;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.ellipse(x, ground - height * 0.47, width * 0.62, height * 0.58, 0, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  }

  context.translate(x, ground + bob - height * 0.03);
  context.scale(unit.dir, 1);
  context.rotate(lean);

  // A subtle live rim light ties the rendered character into every world.
  context.shadowColor = actionColor;
  context.shadowBlur = unit.state === "walk" ? (compact ? 3 : 6) : (compact ? 7 : 13);
  context.drawImage(lemmySprite, -width / 2, -height, width, height);
  context.shadowBlur = 0;

  if (unit.state === "build") {
    // Translucent construction hologram appears just beyond the leading hand.
    const brickWidth = width * 0.35;
    const brickHeight = height * 0.09;
    context.fillStyle = "rgba(255,218,92,0.76)";
    context.strokeStyle = "rgba(255,255,255,0.9)";
    context.lineWidth = Math.max(1, cellSize * 0.05);
    context.shadowColor = "#ffd65d";
    context.shadowBlur = 10;
    roundedPath(width * 0.3, -height * 0.57, brickWidth, brickHeight, brickHeight * 0.25);
    context.fill(); context.stroke();
    context.shadowBlur = 0;
  } else if (unit.state === "bash") {
    // Modern impact flare, kept outside the character so the art stays crisp.
    const impactX = width * 0.58;
    const impactY = -height * 0.47;
    context.fillStyle = "#fff4a6";
    context.shadowColor = "#ff65af";
    context.shadowBlur = 13;
    context.beginPath();
    for (let ray = 0; ray < 12; ray += 1) {
      const angle = ray * Math.PI / 6;
      const radius = ray % 2 ? cellSize * 0.12 : cellSize * 0.3;
      const px = impactX + Math.cos(angle) * radius;
      const py = impactY + Math.sin(angle) * radius;
      if (ray === 0) context.moveTo(px, py); else context.lineTo(px, py);
    }
    context.closePath(); context.fill();
    context.shadowBlur = 0;
  }

  if (falling && unit.float) {
    // A dimensional canopy replaces the old flat umbrella symbol.
    const canopyY = -height * 1.06;
    const canopy = context.createLinearGradient(0, canopyY - height * 0.22, 0, canopyY + height * 0.08);
    canopy.addColorStop(0, "#fff6a8");
    canopy.addColorStop(0.48, "#ff81b8");
    canopy.addColorStop(1, "#9f4de2");
    context.fillStyle = canopy;
    context.strokeStyle = "rgba(255,255,255,0.9)";
    context.lineWidth = Math.max(1.2, cellSize * 0.06);
    context.shadowColor = "#ff79bd";
    context.shadowBlur = 12;
    context.beginPath();
    context.arc(0, canopyY, width * 0.66, Math.PI, Math.PI * 2);
    context.quadraticCurveTo(width * 0.32, canopyY + height * 0.08, 0, canopyY);
    context.quadraticCurveTo(-width * 0.32, canopyY + height * 0.08, -width * 0.66, canopyY);
    context.closePath(); context.fill(); context.stroke();
    context.shadowBlur = 0;
    context.beginPath(); context.moveTo(0, canopyY); context.lineTo(0, -height * 0.52); context.stroke();
  }

  context.restore();
}

function drawPortal(point, cellWidth, cellHeight, theme, time, isExit = false) {
  const x = point.x * cellWidth;
  const y = point.y * cellHeight;
  const pulse = 0.82 + Math.sin(time * 0.004 + (isExit ? 2 : 0)) * 0.12;

  context.save();
  if (!isExit) {
    // A physical launch pod replaces the generic glowing pill.
    const compact = Math.min(cellWidth, cellHeight) < 18;
    const width = cellWidth * (compact ? 1.72 : 1.5);
    const height = cellHeight * (compact ? 1.44 : 1.28);
    const top = y - height;
    context.fillStyle = "rgba(1,0,9,0.4)";
    context.beginPath(); context.ellipse(x, y, width * 0.57, height * 0.14, 0, 0, Math.PI * 2); context.fill();
    context.shadowColor = theme.glow;
    context.shadowBlur = 18 * pulse;
    const shell = context.createLinearGradient(x - width / 2, top, x + width / 2, y);
    shell.addColorStop(0, "#f6f8ff"); shell.addColorStop(0.22, "#8390ad"); shell.addColorStop(0.58, "#313852"); shell.addColorStop(1, "#14182c");
    context.fillStyle = shell;
    roundedPath(x - width / 2, top, width, height, width * 0.32);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = "rgba(12,8,29,0.9)";
    roundedPath(x - width * 0.34, top + height * 0.16, width * 0.68, height * 0.72, width * 0.25);
    context.fill();
    const portalLight = context.createRadialGradient(x, top + height * 0.52, 0, x, top + height * 0.52, width * 0.38);
    portalLight.addColorStop(0, "rgba(255,255,255,0.96)");
    portalLight.addColorStop(0.32, theme.glow);
    portalLight.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = portalLight;
    context.beginPath(); context.ellipse(x, top + height * 0.52, width * 0.29, height * 0.33, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = "rgba(255,255,255,0.82)";
    context.beginPath(); context.arc(x - width * 0.36, top + height * 0.16, Math.max(1.4, width * 0.035), 0, Math.PI * 2); context.fill();
  } else {
    // HOME is a tiny, warm, inhabitable cottage—not another portal. It is
    // deliberately richer than the scenery so the rescue destination is
    // instantly obvious even on a phone.
    const compact = Math.min(cellWidth, cellHeight) < 18;
    const width = cellWidth * (compact ? 2.8 : 2.4);
    const wallHeight = cellHeight * (compact ? 1.55 : 1.42);
    const roofHeight = cellHeight * (compact ? 0.94 : 0.86);
    const left = x - width / 2;
    const wallTop = y - wallHeight;

    context.fillStyle = "rgba(2,1,11,0.46)";
    context.beginPath(); context.ellipse(x, y + 1, width * 0.57, cellHeight * 0.16, 0, 0, Math.PI * 2); context.fill();

    // Chimney and a curl of illuminated smoke.
    const chimney = context.createLinearGradient(0, wallTop - roofHeight, 0, wallTop);
    chimney.addColorStop(0, "#8d5167"); chimney.addColorStop(1, "#46283d");
    context.fillStyle = chimney;
    roundedPath(x + width * 0.25, wallTop - roofHeight * 0.74, width * 0.16, roofHeight * 0.72, width * 0.035);
    context.fill();
    context.strokeStyle = `rgba(255,255,255,${0.22 * pulse})`;
    context.lineWidth = Math.max(1, cellWidth * 0.04);
    context.beginPath();
    context.bezierCurveTo(x + width * 0.33, wallTop - roofHeight * 0.83, x + width * 0.18, wallTop - roofHeight * 1.12, x + width * 0.36, wallTop - roofHeight * 1.32);
    context.stroke();

    const walls = context.createLinearGradient(left, wallTop, left + width, y);
    walls.addColorStop(0, "#fff0cf"); walls.addColorStop(0.5, "#e9bd8f"); walls.addColorStop(1, "#9a5e58");
    context.fillStyle = walls;
    context.strokeStyle = "#39263f";
    context.lineWidth = Math.max(1.4, cellWidth * 0.045);
    roundedPath(left, wallTop, width, wallHeight, cellWidth * 0.16);
    context.fill(); context.stroke();

    // Curved shingle roof with a snow-soft ridge.
    const roof = context.createLinearGradient(x, wallTop - roofHeight, x, wallTop + roofHeight * 0.2);
    roof.addColorStop(0, "#ff7cab"); roof.addColorStop(0.6, "#a43f75"); roof.addColorStop(1, "#54264d");
    context.fillStyle = roof;
    context.beginPath();
    context.moveTo(left - width * 0.1, wallTop + roofHeight * 0.08);
    context.quadraticCurveTo(x - width * 0.33, wallTop - roofHeight * 0.78, x, wallTop - roofHeight);
    context.quadraticCurveTo(x + width * 0.34, wallTop - roofHeight * 0.74, left + width * 1.1, wallTop + roofHeight * 0.08);
    context.quadraticCurveTo(x, wallTop + roofHeight * 0.29, left - width * 0.1, wallTop + roofHeight * 0.08);
    context.closePath(); context.fill(); context.stroke();
    context.strokeStyle = "rgba(255,255,255,0.22)";
    context.lineWidth = 1;
    for (let shingle = 1; shingle < 5; shingle += 1) {
      const sx = left + width * shingle / 5;
      context.beginPath(); context.moveTo(sx, wallTop - roofHeight * 0.43); context.lineTo(sx - width * 0.08, wallTop + roofHeight * 0.07); context.stroke();
    }

    // Lit windows and an open-looking front door.
    const warmLight = context.createRadialGradient(x, wallTop + wallHeight * 0.62, 0, x, wallTop + wallHeight * 0.62, width * 0.65);
    warmLight.addColorStop(0, `rgba(255,222,112,${0.42 * pulse})`); warmLight.addColorStop(1, "rgba(255,222,112,0)");
    context.fillStyle = warmLight; context.fillRect(left - width * 0.2, wallTop - cellHeight * 0.2, width * 1.4, wallHeight * 1.3);
    context.shadowColor = "#ffd968"; context.shadowBlur = 12 * pulse;
    context.fillStyle = "#6e3d50";
    roundedPath(x - width * 0.12, y - wallHeight * 0.7, width * 0.25, wallHeight * 0.7, width * 0.11);
    context.fill();
    context.fillStyle = "#ffe994";
    roundedPath(x - width * 0.075, y - wallHeight * 0.62, width * 0.15, wallHeight * 0.53, width * 0.07);
    context.fill();
    context.shadowBlur = 0;
    [-0.31, 0.31].forEach((offset) => {
      context.fillStyle = "#59354c";
      roundedPath(x + width * offset - width * 0.095, wallTop + wallHeight * 0.31, width * 0.19, wallHeight * 0.25, width * 0.035);
      context.fill();
      context.fillStyle = "#ffe89a";
      roundedPath(x + width * offset - width * 0.068, wallTop + wallHeight * 0.35, width * 0.136, wallHeight * 0.17, width * 0.02);
      context.fill();
      context.strokeStyle = "rgba(89,53,76,0.7)";
      context.beginPath(); context.moveTo(x + width * offset, wallTop + wallHeight * 0.35); context.lineTo(x + width * offset, wallTop + wallHeight * 0.52); context.stroke();
    });

    // Wooden plaque and tiny garden details finish the miniature-house read.
    context.fillStyle = "#70404a";
    roundedPath(x - width * 0.19, wallTop + wallHeight * 0.08, width * 0.38, wallHeight * 0.16, cellWidth * 0.04);
    context.fill();
    context.fillStyle = "#fff2d0";
    context.font = `900 ${Math.max(7, cellHeight * 0.22)}px Manrope, Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("HOME", x, wallTop + wallHeight * 0.16);
    context.fillStyle = theme.glow;
    context.beginPath(); context.arc(left + width * 0.08, y - cellHeight * 0.08, cellWidth * 0.09, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.arc(left + width * 0.18, y - cellHeight * 0.05, cellWidth * 0.07, 0, Math.PI * 2); context.fill();
  }
  context.restore();
}

function drawTerrain(cellWidth, cellHeight, theme) {
  // Physics still uses an exact tile grid, but the player sees continuous
  // sculpted land. Slightly overlapping tile rectangles are filled as a
  // single path, completely removing the old wall-of-rounded-squares look.
  const drawMass = (tileType, fillStyle, shadowColor) => {
    context.save();
    context.beginPath();
    for (let row = 0; row < WORLD_HEIGHT; row += 1) {
      for (let column = 0; column < WORLD_WIDTH; column += 1) {
        if (tiles[row][column] !== tileType) continue;
        context.rect(column * cellWidth - 0.6, row * cellHeight - 0.6, cellWidth + 1.2, cellHeight + 1.2);
      }
    }
    context.fillStyle = fillStyle;
    context.shadowColor = shadowColor;
    context.shadowBlur = 13;
    context.shadowOffsetY = 6;
    context.fill();
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    context.fill();
    context.restore();
  };

  const soil = context.createLinearGradient(0, 0, 0, viewHeight);
  soil.addColorStop(0, theme.soilTop);
  soil.addColorStop(0.18, theme.soil);
  soil.addColorStop(0.72, "#4a315f");
  soil.addColorStop(1, "#20152f");
  const steel = context.createLinearGradient(0, 0, viewWidth, viewHeight);
  steel.addColorStop(0, "#f4f7ff");
  steel.addColorStop(0.22, "#93a2c4");
  steel.addColorStop(0.58, "#4b5578");
  steel.addColorStop(1, "#242a43");
  drawMass(SOFT, soil, "rgba(1,0,8,0.7)");
  drawMass(STEEL, steel, "rgba(1,0,8,0.8)");

  // Draw exposed tops as long, organic ridges rather than one cap per cell.
  [SOFT, STEEL].forEach((tileType) => {
    for (let row = 0; row < WORLD_HEIGHT; row += 1) {
      let column = 0;
      while (column < WORLD_WIDTH) {
        if (tileAt(column, row) !== tileType || tileAt(column, row - 1) !== EMPTY) {
          column += 1;
          continue;
        }
        const start = column;
        while (column < WORLD_WIDTH && tileAt(column, row) === tileType && tileAt(column, row - 1) === EMPTY) column += 1;
        const left = start * cellWidth;
        const right = column * cellWidth;
        const top = row * cellHeight;
        const capHeight = Math.max(4, cellHeight * 0.24);
        const cap = context.createLinearGradient(0, top - 2, 0, top + capHeight);
        if (tileType === STEEL) {
          cap.addColorStop(0, "#ffffff"); cap.addColorStop(0.35, "#cbd5ee"); cap.addColorStop(1, "#687696");
        } else {
          cap.addColorStop(0, "#fff0f7"); cap.addColorStop(0.18, theme.soilTop); cap.addColorStop(1, theme.soil);
        }
        context.fillStyle = cap;
        context.beginPath();
        context.moveTo(left, top + capHeight * 0.16);
        for (let xStep = left; xStep <= right; xStep += Math.max(8, cellWidth * 0.5)) {
          const lift = tileType === STEEL ? 0 : Math.sin((xStep / cellWidth) * 2.3 + row) * capHeight * 0.11;
          context.lineTo(Math.min(xStep, right), top + lift);
        }
        context.lineTo(right, top + capHeight);
        context.lineTo(left, top + capHeight);
        context.closePath(); context.fill();
        context.strokeStyle = tileType === STEEL ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.48)";
        context.lineWidth = tileType === STEEL ? 1.6 : 1.2;
        context.beginPath(); context.moveTo(left, top); context.lineTo(right, top); context.stroke();

        if (tileType === STEEL) {
          // Large engineered plates: a seam every four cells, not a visible
          // collision grid around every tile.
          context.fillStyle = "rgba(255,255,255,0.62)";
          for (let plate = start; plate < column; plate += 4) {
            const px = plate * cellWidth + cellWidth * 0.18;
            context.beginPath(); context.arc(px, top + capHeight * 0.58, Math.max(1, cellWidth * 0.035), 0, Math.PI * 2); context.fill();
          }
        } else {
          // Soft tufts and tiny fibres keep the ridge tactile and alive.
          context.strokeStyle = "rgba(255,255,255,0.28)";
          context.lineWidth = 1;
          for (let tuft = start; tuft < column; tuft += 2) {
            const tx = (tuft + 0.45) * cellWidth;
            context.beginPath();
            context.moveTo(tx, top + 1); context.quadraticCurveTo(tx + cellWidth * 0.1, top - capHeight * 0.35, tx + cellWidth * 0.2, top + 1);
            context.stroke();
          }
        }
      }
    }
  });

  // Sparse embedded texture gives the land depth without revealing the grid.
  for (let row = 0; row < WORLD_HEIGHT; row += 1) {
    for (let column = 0; column < WORLD_WIDTH; column += 1) {
      if (tiles[row][column] !== SOFT || (column * 11 + row * 7) % 5 !== 0) continue;
      const x = (column + 0.64) * cellWidth;
      const y = (row + 0.58) * cellHeight;
      context.fillStyle = "rgba(255,255,255,0.08)";
      context.beginPath(); context.ellipse(x, y, Math.max(1, cellWidth * 0.045), Math.max(0.7, cellHeight * 0.025), -0.4, 0, Math.PI * 2); context.fill();
    }
  }
}

function drawGame(time) {
  const cellWidth = viewWidth / WORLD_WIDTH;
  const cellHeight = viewHeight / WORLD_HEIGHT;
  const theme = THEMES[currentLevel.theme];

  // Layered sky with an aurora, planet and deterministic twinkling stars.
  const sky = context.createLinearGradient(0, 0, 0, viewHeight);
  sky.addColorStop(0, theme.sky);
  sky.addColorStop(0.62, "#17102d");
  sky.addColorStop(1, "#0a0715");
  context.fillStyle = sky;
  context.fillRect(0, 0, viewWidth, viewHeight);

  const aurora = context.createRadialGradient(viewWidth * 0.72, viewHeight * 0.08, 0, viewWidth * 0.72, viewHeight * 0.08, viewWidth * 0.5);
  aurora.addColorStop(0, `${theme.glow}38`);
  aurora.addColorStop(1, "transparent");
  context.fillStyle = aurora;
  context.fillRect(0, 0, viewWidth, viewHeight);

  context.save();
  context.globalAlpha = 0.12;
  context.fillStyle = theme.glow;
  context.beginPath();
  context.arc(viewWidth * 0.82, viewHeight * 0.18, Math.min(viewWidth, viewHeight) * 0.13, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.35)";
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(viewWidth * 0.82, viewHeight * 0.18, Math.min(viewWidth, viewHeight) * 0.2, Math.min(viewWidth, viewHeight) * 0.045, -0.22, 0, Math.PI * 2);
  context.stroke();
  context.restore();

  for (let index = 0; index < 58; index += 1) {
    const x = ((index * 89 + currentLevelIndex * 37) % 997) / 997 * viewWidth;
    const y = ((index * 53 + currentLevelIndex * 17) % 541) / 541 * viewHeight * 0.72;
    const twinkle = 0.22 + (Math.sin(time * 0.002 + index * 1.7) + 1) * 0.22;
    context.globalAlpha = twinkle;
    context.fillStyle = index % 9 === 0 ? theme.glow : "white";
    context.beginPath();
    context.arc(x, y, index % 7 === 0 ? 1.7 : 0.85, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  // Danger zones are animated energy, water or star fields—not flat blocks.
  hazards.forEach((hazard, hazardIndex) => {
    const x = hazard.x * cellWidth;
    const y = hazard.y * cellHeight;
    const width = hazard.width * cellWidth;
    const color = hazard.kind === "water" ? "#40cfff" : hazard.kind === "storm" ? "#a06cff" : "#ffd659";
    const danger = context.createLinearGradient(0, y, 0, viewHeight);
    danger.addColorStop(0, `${color}cc`);
    danger.addColorStop(1, `${color}28`);
    context.fillStyle = danger;
    context.fillRect(x, y + 3, width, viewHeight - y);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.shadowColor = color;
    context.shadowBlur = 10;
    context.beginPath();
    for (let step = 0; step <= 18; step += 1) {
      const waveX = x + width * step / 18;
      const waveY = y + Math.sin(time * 0.006 + step * 0.85 + hazardIndex) * 3;
      if (step === 0) context.moveTo(waveX, waveY); else context.lineTo(waveX, waveY);
    }
    context.stroke();
    context.shadowBlur = 0;
    for (let spark = 0; spark < 5; spark += 1) {
      const sparkX = x + ((spark * 37 + hazardIndex * 11) % 97) / 97 * width;
      const sparkY = y + 8 + ((time * 0.018 + spark * 17) % Math.max(10, viewHeight - y - 8));
      context.globalAlpha = 0.45;
      context.fillStyle = "white";
      context.fillRect(sparkX, sparkY, 1.5, 1.5);
    }
    context.globalAlpha = 1;
  });

  drawTerrain(cellWidth, cellHeight, theme);

  drawPortal(currentLevel.spawn, cellWidth, cellHeight, theme, time, false);
  drawPortal(currentLevel.exit, cellWidth, cellHeight, theme, time, true);
  dolls.forEach((item) => drawPlush(item, cellWidth, cellHeight, time));
  units.filter((unit) => unit.active).forEach((unit) => drawUnit(unit, cellWidth, cellHeight, time));

  particles.forEach((particle) => {
    context.save();
    context.globalAlpha = Math.max(0, particle.life);
    context.fillStyle = particle.color;
    context.shadowColor = particle.color;
    context.shadowBlur = 9;
    context.beginPath();
    context.arc(particle.x * cellWidth, particle.y * cellHeight, 2.6, 0, Math.PI * 2);
    context.fill();
    context.restore();
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
  if (soundEnabled) startLevelMusic(0.08);
  else stopLevelMusic();
});
modalPrimary.addEventListener("click", () => modalPrimaryAction?.());
modalSecondary.addEventListener("click", () => modalSecondaryAction?.());
window.addEventListener("resize", resizeCanvas, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden && running && !paused) togglePause();
});
window.addEventListener("online", () => {
  offlineBadge.textContent = "Game ready";
  offlineBadge.classList.remove("offline");
});
window.addEventListener("offline", () => {
  offlineBadge.textContent = "No connection";
  offlineBadge.classList.add("offline");
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

offlineBadge.textContent = navigator.onLine ? "Game ready" : "No connection";
offlineBadge.classList.toggle("offline", !navigator.onLine);
updateSoundButton();
updateMenu();
animationFrame = requestAnimationFrame(gameLoop);
window.addEventListener("pagehide", () => {
  stopLevelMusic();
  cancelAnimationFrame(animationFrame);
});
