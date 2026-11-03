(function palavraQuestPWA() {
  'use strict';

  const STATE_KEY = 'palavra.quest.pwa-install.v1';
  const IOS_TRANSFER_COOKIE = 'pq_pwa_transfer';
  const MAX_AUTOMATIC_OFFERS = 3;
  const COMPLETE_MISSION_SECONDS = 179;
  let deferredInstallPrompt = null;
  let callbacks = { getProgress: null, restoreProgress: null };
  let initialized = false;

  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
      return {
        offers: Math.min(MAX_AUTOMATIC_OFFERS, Math.max(0, Number(saved.offers) || 0)),
        dismissed: saved.dismissed === true,
        installed: saved.installed === true
      };
    } catch {
      return { offers: 0, dismissed: false, installed: false };
    }
  }

  function writeState(state) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch {}
  }

  function isIOS() {
    const ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent || '');
  }

  function isMobile() {
    if (navigator.userAgentData?.mobile === true) return true;
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') ||
      (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) <= 1024);
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true ||
      document.referrer.startsWith('android-app://');
  }

  function root() {
    return document.querySelector('#pwaInstallRoot');
  }

  function hasTransferMarker() {
    return document.cookie.split(';').some(part => part.trim().startsWith(`${IOS_TRANSFER_COOKIE}=`));
  }

  function setTransferMarker(enabled) {
    const maxAge = enabled ? 3600 : 0;
    document.cookie = `${IOS_TRANSFER_COOKIE}=${enabled ? '1' : ''}; path=/learn/portuguese/; max-age=${maxAge}; SameSite=Lax; Secure`;
  }

  function progressIsEmpty() {
    const progress = callbacks.getProgress?.();
    return !progress || (!Object.keys(progress.words || {}).length && !(Number(progress.totalSeconds) > 0));
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function closeModal() {
    document.querySelector('#pwaInstallModal')?.remove();
    document.body.classList.remove('pwa-modal-open');
  }

  function showMessage(title, body) {
    closeModal();
    const host = root();
    if (!host) return;
    host.insertAdjacentHTML('beforeend', `
      <div class="pwa-install-modal" id="pwaInstallModal" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle">
        <div class="pwa-install-card">
          <span class="pwa-install-art" aria-hidden="true">✦</span>
          <div class="pwa-install-kicker">PALAVRA QUEST APP</div>
          <h2 id="pwaInstallTitle">${escapeHTML(title)}</h2>
          <p>${escapeHTML(body)}</p>
          <button class="btn btn-primary" id="pwaMessageDone">Done</button>
        </div>
      </div>`);
    document.body.classList.add('pwa-modal-open');
    document.querySelector('#pwaMessageDone')?.addEventListener('click', closeModal);
  }

  async function copyProgressForIOS() {
    const progress = callbacks.getProgress?.();
    if (!progress) return false;
    const backup = JSON.stringify({
      type: 'palavra-quest-backup',
      version: 4,
      savedAt: new Date().toISOString(),
      progress
    });
    let copied = false;
    try {
      await navigator.clipboard.writeText(backup);
      copied = true;
    } catch {
      const field = document.createElement('textarea');
      field.value = backup;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch {}
      field.remove();
    }
    if (copied) setTransferMarker(true);
    return copied;
  }

  async function restoreIOSProgress() {
    try {
      const text = await navigator.clipboard.readText();
      const backup = JSON.parse(text);
      if (backup?.type !== 'palavra-quest-backup' || !backup.progress?.words) throw Error('invalid backup');
      callbacks.restoreProgress?.(backup.progress);
      setTransferMarker(false);
      renderButton();
      showMessage('Progress restored', 'Your vocabulary, practice time and adaptive review schedule are ready in the app.');
    } catch {
      showMessage('Allow clipboard access', 'Tap Restore progress again and allow Palavra Quest to read the progress you copied in Safari. You can also use Export and Restore in Settings.');
    }
  }

  function showIOSInstructions() {
    closeModal();
    const host = root();
    if (!host) return;
    host.insertAdjacentHTML('beforeend', `
      <div class="pwa-install-modal" id="pwaInstallModal" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle">
        <div class="pwa-install-card">
          <button class="pwa-modal-close" id="pwaModalClose" aria-label="Close installation instructions">×</button>
          <span class="pwa-install-art" aria-hidden="true">✦</span>
          <div class="pwa-install-kicker">INSTALL ON IPHONE OR IPAD</div>
          <h2 id="pwaInstallTitle">Keep your Portuguese quest one tap away</h2>
          <ol class="pwa-ios-steps">
            <li>Tap <strong>Share</strong> in your browser.</li>
            <li>Choose <strong>Add to Home Screen</strong>.</li>
            <li>Keep <strong>Open as Web App</strong> turned on, then tap Add.</li>
            <li>Open Palavra Quest and tap <strong>Restore progress</strong>.</li>
          </ol>
          <p class="pwa-transfer-status" id="pwaTransferStatus">Preparing a private copy of your progress for the new app…</p>
          <div class="pwa-modal-actions">
            <button class="btn btn-primary" id="pwaIOSReady" disabled>Progress ready</button>
            <button class="btn btn-ghost" id="pwaIOSLater">Not now</button>
          </div>
          <small>iOS does not allow websites to install automatically. Your progress copy stays on this device.</small>
        </div>
      </div>`);
    document.body.classList.add('pwa-modal-open');
    document.querySelector('#pwaModalClose')?.addEventListener('click', closeModal);
    document.querySelector('#pwaIOSLater')?.addEventListener('click', closeModal);
    copyProgressForIOS().then(copied => {
      const status = document.querySelector('#pwaTransferStatus');
      const ready = document.querySelector('#pwaIOSReady');
      if (!status || !ready) return;
      status.textContent = copied
        ? '✓ Your complete progress is copied. Follow the four steps above.'
        : 'Clipboard access was blocked. Export your progress from Settings before installing, then restore that file in the app.';
      ready.disabled = false;
      ready.textContent = 'Got it';
      ready.addEventListener('click', closeModal, { once: true });
    });
  }

  function showAndroidFallback() {
    closeModal();
    const host = root();
    if (!host) return;
    host.insertAdjacentHTML('beforeend', `
      <div class="pwa-install-modal" id="pwaInstallModal" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle">
        <div class="pwa-install-card">
          <button class="pwa-modal-close" id="pwaModalClose" aria-label="Close installation instructions">×</button>
          <span class="pwa-install-art" aria-hidden="true">✦</span>
          <div class="pwa-install-kicker">INSTALL PALAVRA QUEST</div>
          <h2 id="pwaInstallTitle">Add the quest to your phone</h2>
          <p>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. Your saved progress stays with Palavra Quest.</p>
          <button class="btn btn-primary" id="pwaAndroidDone">Got it</button>
        </div>
      </div>`);
    document.body.classList.add('pwa-modal-open');
    document.querySelector('#pwaModalClose')?.addEventListener('click', closeModal);
    document.querySelector('#pwaAndroidDone')?.addEventListener('click', closeModal);
  }

  async function requestInstall() {
    if (isIOS()) {
      showIOSInstructions();
      return;
    }
    if (!deferredInstallPrompt) {
      showAndroidFallback();
      return;
    }
    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice?.outcome === 'accepted') {
      const state = readState();
      state.installed = true;
      writeState(state);
      closeModal();
    }
    renderButton();
  }

  function showAutomaticOffer() {
    closeModal();
    const host = root();
    if (!host) return;
    host.insertAdjacentHTML('beforeend', `
      <div class="pwa-install-modal" id="pwaInstallModal" role="dialog" aria-modal="true" aria-labelledby="pwaInstallTitle">
        <div class="pwa-install-card">
          <button class="pwa-modal-close" id="pwaModalClose" aria-label="Close install offer">×</button>
          <span class="pwa-install-art" aria-hidden="true">✦</span>
          <div class="pwa-install-kicker">MISSÃO COMPLETA!</div>
          <h2 id="pwaInstallTitle">Take Palavra Quest with you</h2>
          <p>You finished a full three-minute mission. Add Palavra Quest to your Home Screen and continue with the same vocabulary progress.</p>
          <div class="pwa-modal-actions">
            <button class="btn btn-primary" id="pwaOfferInstall">Install Palavra Quest</button>
            <button class="btn btn-ghost" id="pwaOfferLater">Not now</button>
          </div>
        </div>
      </div>`);
    document.body.classList.add('pwa-modal-open');
    document.querySelector('#pwaModalClose')?.addEventListener('click', closeModal);
    document.querySelector('#pwaOfferLater')?.addEventListener('click', closeModal);
    document.querySelector('#pwaOfferInstall')?.addEventListener('click', requestInstall);
  }

  function dismissInstallButton() {
    const state = readState();
    state.dismissed = true;
    writeState(state);
    closeModal();
    renderButton();
  }

  function renderButton() {
    const host = root();
    if (!host) return;
    host.querySelector('#pwaInstallPill')?.remove();
    host.querySelector('#pwaRestorePill')?.remove();
    const state = readState();

    if (isStandalone()) {
      if (isIOS() && hasTransferMarker() && progressIsEmpty()) {
        host.insertAdjacentHTML('beforeend', `
          <div class="pwa-restore-pill" id="pwaRestorePill">
            <span><strong>Continue your quest</strong><small>Bring in your progress from Safari.</small></span>
            <button class="btn btn-primary btn-small" id="pwaRestoreProgress">Restore progress</button>
          </div>`);
        document.querySelector('#pwaRestoreProgress')?.addEventListener('click', restoreIOSProgress);
      }
      return;
    }

    if (!isMobile() || state.dismissed || state.installed) return;
    host.insertAdjacentHTML('beforeend', `
      <div class="pwa-install-pill" id="pwaInstallPill">
        <button class="pwa-install-main" id="pwaInstallButton" aria-label="Install Palavra Quest">
          <span aria-hidden="true">✦</span><strong>Install Palavra Quest</strong>
        </button>
        <button class="pwa-install-dismiss" id="pwaInstallDismiss" aria-label="Dismiss install button">×</button>
      </div>`);
    document.querySelector('#pwaInstallButton')?.addEventListener('click', requestInstall);
    document.querySelector('#pwaInstallDismiss')?.addEventListener('click', dismissInstallButton);
  }

  function afterSuccessfulMission(details = {}) {
    const state = readState();
    const successful = Number(details.elapsed) >= COMPLETE_MISSION_SECONDS && Number(details.questions) > 0;
    if (!successful || !isMobile() || isStandalone() || state.dismissed || state.installed || state.offers >= MAX_AUTOMATIC_OFFERS) return false;
    state.offers += 1;
    writeState(state);
    showAutomaticOffer();
    return true;
  }

  function configure(nextCallbacks = {}) {
    callbacks = { ...callbacks, ...nextCallbacks };
    if (!initialized) {
      initialized = true;
      window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        renderButton();
      });
      window.addEventListener('appinstalled', () => {
        const state = readState();
        state.installed = true;
        writeState(state);
        deferredInstallPrompt = null;
        closeModal();
        renderButton();
      });
      window.matchMedia('(display-mode: standalone)').addEventListener?.('change', renderButton);
    }
    renderButton();
  }

  window.PalavraPWA = Object.freeze({
    configure,
    afterSuccessfulMission,
    requestInstall,
    refresh: renderButton,
    status: () => ({
      mobile: isMobile(),
      ios: isIOS(),
      android: isAndroid(),
      standalone: isStandalone(),
      hasNativePrompt: Boolean(deferredInstallPrompt),
      state: readState()
    })
  });
})();
