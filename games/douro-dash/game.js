(function runDouroDash() {
  "use strict";

  const core = window.DouroDashCore;
  if (!core) throw new Error("Douro Dash core did not load.");

  const STORAGE_KEY = "douro-dash-progress-v1";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const directionArrows = { up: "↑", right: "→", down: "↓", left: "←" };

  const elements = {
    board: document.getElementById("board"),
    headerLevel: document.getElementById("header-level"),
    levelKicker: document.getElementById("level-kicker"),
    levelName: document.getElementById("level-name"),
    levelSubtitle: document.getElementById("level-subtitle"),
    target: document.getElementById("target-value"),
    cargo: document.getElementById("cargo-value"),
    moves: document.getElementById("moves-value"),
    movesCard: document.querySelector(".moves-card"),
    eventToast: document.getElementById("event-toast"),
    levelButton: document.getElementById("level-button"),
    restartButton: document.getElementById("restart-button"),
    levelModal: document.getElementById("level-modal"),
    levelGrid: document.getElementById("level-grid"),
    resetProgress: document.getElementById("reset-progress"),
    resultModal: document.getElementById("result-modal"),
    resultEmblem: document.getElementById("result-emblem"),
    resultKicker: document.getElementById("result-kicker"),
    resultTitle: document.getElementById("result-title"),
    resultCopy: document.getElementById("result-copy"),
    resultScore: document.getElementById("result-score"),
    resultPrimary: document.getElementById("result-primary"),
    resultSecondary: document.getElementById("result-secondary")
  };

  let progress = loadProgress();
  let state = null;
  let toastTimer = 0;
  let swipeStart = null;
  let resultActions = { primary: null, secondary: null };

  function defaultProgress() {
    return {
      unlocked: 1,
      cleared: Array(core.LEVELS.length).fill(false),
      best: Array(core.LEVELS.length).fill(0)
    };
  }

  function loadProgress() {
    const fallback = defaultProgress();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved !== "object") return fallback;
      const cleared = fallback.cleared.map((_, index) => Boolean(saved.cleared?.[index]));
      const best = fallback.best.map((_, index) => Math.max(0, Number(saved.best?.[index]) || 0));
      const unlocked = Math.min(core.LEVELS.length, Math.max(1, Number(saved.unlocked) || 1));
      return { unlocked, cleared, best };
    } catch (error) {
      return fallback;
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function firstUnclearedLevel() {
    const index = progress.cleared.findIndex((cleared, levelIndex) => !cleared && levelIndex < progress.unlocked);
    if (index !== -1) return index;
    return Math.max(0, Math.min(progress.unlocked - 1, core.LEVELS.length - 1));
  }

  function startLevel(levelIndex) {
    const safeIndex = Math.max(0, Math.min(levelIndex, progress.unlocked - 1, core.LEVELS.length - 1));
    const level = core.LEVELS[safeIndex];
    state = {
      levelIndex: safeIndex,
      level,
      lookup: core.createLookup(level),
      position: { ...level.dock },
      movesLeft: level.moves,
      collectedMask: 0,
      cargoScore: 0,
      leftDock: false,
      locked: false,
      ended: false,
      pickupKeys: new Map()
    };
    closeModal(elements.levelModal);
    closeModal(elements.resultModal);
    render();
    elements.board.focus({ preventScroll: true });
  }

  function render() {
    const { level } = state;
    elements.headerLevel.textContent = `${String(level.id).padStart(2, "0")} / 12`;
    elements.levelKicker.textContent = `Level ${level.id} · ${level.moves} moves`;
    elements.levelName.textContent = level.name;
    elements.levelSubtitle.textContent = level.subtitle;
    elements.target.textContent = level.target;
    elements.cargo.textContent = state.cargoScore;
    elements.moves.textContent = state.movesLeft;
    elements.movesCard.classList.toggle("danger", state.movesLeft <= 2 && !state.ended);
    renderBoard();
  }

  function renderBoard(extraBoatClass = "") {
    const { level, lookup } = state;
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < core.BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < core.BOARD_WIDTH; x += 1) {
        const tileKey = core.key(x, y);
        const tile = document.createElement("div");
        const labels = [`Column ${x + 1}, row ${y + 1}`];
        tile.className = "tile";

        if (x === level.dock.x && y === level.dock.y) {
          tile.classList.add("tile-dock");
          const dock = document.createElement("span");
          dock.className = "dock";
          dock.setAttribute("aria-hidden", "true");
          tile.append(dock);
          labels.push("dock");
        }

        if (lookup.reef.has(tileKey)) {
          const reef = document.createElement("span");
          reef.className = "reef";
          reef.setAttribute("aria-hidden", "true");
          tile.append(reef);
          labels.push("reef, blocked");
        }

        const current = lookup.current.get(tileKey);
        if (current) {
          const directionName = current.dy < 0 ? "up" : current.dy > 0 ? "down" : current.dx > 0 ? "right" : "left";
          const currentElement = document.createElement("span");
          currentElement.className = `current current-${directionName}`;
          currentElement.textContent = "↟";
          currentElement.setAttribute("aria-hidden", "true");
          tile.append(currentElement);
          labels.push(`current pushing ${directionName}`);
        }

        const cargo = lookup.cargo.get(tileKey);
        if (cargo && !(state.collectedMask & (1 << cargo.index))) {
          const crate = document.createElement("span");
          crate.className = "cargo";
          crate.innerHTML = `<b>${cargo.value}</b>`;
          crate.setAttribute("aria-hidden", "true");
          tile.append(crate);
          labels.push(`cargo worth ${cargo.value}`);
        }

        if (state.pickupKeys.has(tileKey)) {
          const burst = document.createElement("span");
          burst.className = "pickup-burst";
          burst.textContent = `+${state.pickupKeys.get(tileKey)}`;
          burst.setAttribute("aria-hidden", "true");
          tile.append(burst);
        }

        if (state.position.x === x && state.position.y === y) {
          tile.append(createBoat(extraBoatClass));
          labels.push(`boat carrying ${state.cargoScore} cargo`);
        }

        tile.setAttribute("aria-label", labels.join(", "));
        fragment.append(tile);
      }
    }

    elements.board.replaceChildren(fragment);
  }

  function createBoat(extraClass) {
    const boat = document.createElement("span");
    boat.className = `boat ${extraClass}`.trim();
    boat.setAttribute("aria-hidden", "true");
    const loadCount = Math.min(3, Math.ceil(state.cargoScore / 3));
    boat.innerHTML = `
      <i class="boat-flag"></i>
      <i class="boat-cabin"></i>
      <i class="boat-hull"></i>
      <span class="boat-load">${"<i></i>".repeat(loadCount)}</span>
    `;
    return boat;
  }

  function addCargoAt(position) {
    const cargo = state.lookup.cargo.get(core.key(position.x, position.y));
    if (!cargo || state.collectedMask & (1 << cargo.index)) return 0;
    state.collectedMask |= 1 << cargo.index;
    state.cargoScore += cargo.value;
    state.pickupKeys.set(core.key(position.x, position.y), cargo.value);
    return cargo.value;
  }

  function wait(milliseconds) {
    if (reducedMotion) return Promise.resolve();
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function move(directionName) {
    if (!state || state.locked || state.ended || !elements.levelModal.hidden || !elements.resultModal.hidden) return false;
    const transition = core.getMove(state.level, state.position, directionName, { lookup: state.lookup });
    if (!transition.valid) {
      showToast(transition.reason === "reef" ? "Reef ahead — no move used" : "River edge — no move used");
      elements.board.classList.remove("blocked");
      void elements.board.offsetWidth;
      elements.board.classList.add("blocked");
      if (navigator.vibrate) navigator.vibrate(18);
      return false;
    }

    state.locked = true;
    state.movesLeft -= 1;
    const leftDockDuringMove = transition.path.some((position) => position.x !== state.level.dock.x || position.y !== state.level.dock.y);
    const wasAway = state.leftDock || leftDockDuringMove;
    let gained = 0;

    state.position = { ...transition.path[0] };
    gained += addCargoAt(state.position);
    render();

    if (transition.usedCurrent) {
      renderBoard("pushing");
      showToast("Current! Free river push");
      await wait(170);
      state.position = { ...transition.path[1] };
      gained += addCargoAt(state.position);
      render();
      await wait(100);
    } else {
      await wait(95);
    }

    state.leftDock = wasAway;
    if (gained > 0) showToast(`Cargo collected · +${gained}`);

    const docked = state.leftDock && state.position.x === state.level.dock.x && state.position.y === state.level.dock.y;
    if (docked) {
      renderBoard("docking");
      await wait(260);
      finishDockedRun();
      return true;
    }

    if (state.movesLeft === 0) {
      await wait(180);
      finishStrandedRun();
      return true;
    }

    state.pickupKeys.clear();
    state.locked = false;
    render();
    return true;
  }

  function finishDockedRun() {
    state.ended = true;
    state.locked = false;
    const cleared = state.cargoScore >= state.level.target;
    progress.best[state.levelIndex] = Math.max(progress.best[state.levelIndex], state.cargoScore);

    if (cleared) {
      progress.cleared[state.levelIndex] = true;
      progress.unlocked = Math.min(core.LEVELS.length, Math.max(progress.unlocked, state.levelIndex + 2));
    }
    saveProgress();

    if (cleared && state.levelIndex === core.LEVELS.length - 1) {
      showResult({
        emblem: "🏆",
        kicker: "Twelve voyages complete",
        title: "Douro mastered!",
        copy: "Every crate is banked and the whole river map is yours to replay.",
        score: state.cargoScore,
        primaryLabel: "Choose a Level",
        secondaryLabel: "Replay Final Level",
        primary: openLevelPicker,
        secondary: () => startLevel(state.levelIndex)
      });
      return;
    }

    if (cleared) {
      showResult({
        emblem: "⚓",
        kicker: "Cargo banked",
        title: "Voyage cleared!",
        copy: `${state.level.name} is complete. The next stretch of river is open.`,
        score: state.cargoScore,
        primaryLabel: "Next Level",
        secondaryLabel: "Replay Level",
        primary: () => startLevel(state.levelIndex + 1),
        secondary: () => startLevel(state.levelIndex)
      });
    } else {
      showResult({
        emblem: "📦",
        kicker: "Safe at the dock",
        title: "More cargo needed",
        copy: `You banked ${state.cargoScore}. Find a route worth at least ${state.level.target}.`,
        score: state.cargoScore,
        primaryLabel: "Retry",
        secondaryLabel: "Choose a Level",
        primary: () => startLevel(state.levelIndex),
        secondary: openLevelPicker
      });
    }
  }

  function finishStrandedRun() {
    state.ended = true;
    state.locked = false;
    showResult({
      emblem: "🌊",
      kicker: "Moves exhausted",
      title: "Cargo lost upriver",
      copy: "The boat ran out of moves away from the dock. Plan the return before the last crate.",
      score: 0,
      primaryLabel: "Retry",
      secondaryLabel: "Choose a Level",
      primary: () => startLevel(state.levelIndex),
      secondary: openLevelPicker
    });
  }

  function showResult(config) {
    elements.resultEmblem.textContent = config.emblem;
    elements.resultKicker.textContent = config.kicker;
    elements.resultTitle.textContent = config.title;
    elements.resultCopy.textContent = config.copy;
    elements.resultScore.textContent = config.score;
    elements.resultPrimary.textContent = config.primaryLabel;
    elements.resultSecondary.textContent = config.secondaryLabel;
    resultActions = { primary: config.primary, secondary: config.secondary };
    openModal(elements.resultModal, elements.resultPrimary);
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.eventToast.textContent = message;
    elements.eventToast.classList.add("show");
    toastTimer = window.setTimeout(() => elements.eventToast.classList.remove("show"), 1250);
  }

  function renderLevelPicker() {
    elements.levelGrid.replaceChildren(...core.LEVELS.map((level, index) => {
      const button = document.createElement("button");
      const unlocked = index < progress.unlocked;
      const best = progress.best[index];
      button.type = "button";
      button.className = `level-choice${state?.levelIndex === index ? " current" : ""}`;
      button.disabled = !unlocked;
      button.innerHTML = `<span>${unlocked ? `Level ${level.id}` : "Locked"}</span><strong>${level.name}</strong><small>${best ? `Best ${best}` : unlocked ? "Ready" : "Complete the previous voyage"}</small>`;
      if (unlocked) button.addEventListener("click", () => startLevel(index));
      return button;
    }));
  }

  function openLevelPicker() {
    closeModal(elements.resultModal);
    renderLevelPicker();
    openModal(elements.levelModal, elements.levelGrid.querySelector("button:not(:disabled)"));
  }

  function openModal(modal, focusTarget) {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    window.setTimeout(() => focusTarget?.focus(), 0);
  }

  function closeModal(modal) {
    modal.hidden = true;
    if (elements.levelModal.hidden && elements.resultModal.hidden) document.body.classList.remove("modal-open");
  }

  function directionFromSwipe(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return null;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  }

  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => move(button.dataset.direction));
  });
  elements.restartButton.addEventListener("click", () => startLevel(state.levelIndex));
  elements.levelButton.addEventListener("click", openLevelPicker);
  elements.resultPrimary.addEventListener("click", () => resultActions.primary?.());
  elements.resultSecondary.addEventListener("click", () => resultActions.secondary?.());
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal(elements.levelModal));
  });
  elements.resetProgress.addEventListener("click", () => {
    if (!window.confirm("Reset all Douro Dash levels and best scores?")) return;
    progress = defaultProgress();
    saveProgress();
    startLevel(0);
  });

  elements.board.tabIndex = 0;
  elements.board.addEventListener("pointerdown", (event) => {
    swipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    elements.board.setPointerCapture?.(event.pointerId);
  });
  elements.board.addEventListener("pointerup", (event) => {
    if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;
    const direction = directionFromSwipe(swipeStart, { x: event.clientX, y: event.clientY });
    swipeStart = null;
    if (direction) move(direction);
  });
  elements.board.addEventListener("pointercancel", () => { swipeStart = null; });

  window.addEventListener("keydown", (event) => {
    const keyMap = { ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left", w: "up", d: "right", s: "down", a: "left" };
    const direction = keyMap[event.key];
    if (direction) {
      event.preventDefault();
      move(direction);
    }
    if (event.key === "Escape" && !elements.levelModal.hidden) closeModal(elements.levelModal);
  });

  window.__douroDashDebug = {
    move,
    startLevel,
    openLevelPicker,
    getSnapshot: () => ({
      levelIndex: state.levelIndex,
      position: { ...state.position },
      movesLeft: state.movesLeft,
      cargoScore: state.cargoScore,
      collectedMask: state.collectedMask,
      leftDock: state.leftDock,
      ended: state.ended,
      progress: JSON.parse(JSON.stringify(progress))
    }),
    getProgress: () => JSON.parse(JSON.stringify(progress)),
    storageKey: STORAGE_KEY
  };

  startLevel(firstUnclearedLevel());
})();
