'use strict';

const params = new URLSearchParams(location.search);
const asset = params.get('asset') || 'home';
const artboard = document.querySelector('#artboard');
const icon = '/extensions/palavra-quest-reminder/icons/icon128.png';

function brand() {
  return `<div class="brand"><img src="${icon}" alt=""><span>palavra<b>quest</b></span></div>`;
}

function browserFrame() {
  return `<div class="browser">
    <div class="browser-bar"><i></i><i></i><i></i><span class="address">justforme.ai/learn/portuguese</span></div>
    <iframe class="app-window" id="appFrame" src="/learn/portuguese/?store-artwork=${asset}" title="Palavra Quest"></iframe>
  </div>`;
}

const screenshotCopy = {
  home: {
    kicker: 'FREE · EUROPEAN PORTUGUESE',
    title: 'Three minutes.<br><span>Real progress.</span>',
    text: 'A beautiful daily quest that remembers what you know—and brings back what you need.',
    pill: '⚡ Quick daily missions'
  },
  quest: {
    kicker: 'SMART ADAPTIVE PRACTICE',
    title: 'Practise what<br><span>you need.</span>',
    text: 'Listening, spelling, sentences and stories are chosen to match your growing level.',
    pill: '🧠 Difficult words return'
  }
};

function renderScreenshot(kind) {
  const copy = screenshotCopy[kind];
  artboard.innerHTML = `<section class="asset ${kind}">
    ${brand()}
    <div class="copy">
      <p class="kicker">${copy.kicker}</p>
      <h1>${copy.title}</h1>
      <p>${copy.text}</p>
      <span class="pill">${copy.pill}</span>
    </div>
    ${browserFrame()}
    <div class="ring"></div>
  </section>`;

  const frame = document.querySelector('#appFrame');
  frame.addEventListener('load', () => {
    if (kind !== 'quest') return;
    setTimeout(() => frame.contentDocument.querySelector('#quickPlay')?.click(), 250);
  });
}

function popupSource() {
  return fetch('/extensions/palavra-quest-reminder/popup.html')
    .then(response => response.text())
    .then(html => html
      .replace('<head>', '<head><base href="/extensions/palavra-quest-reminder/">')
      .replace(/<script src="popup\.js"><\/script>/, ''));
}

async function renderReminder() {
  artboard.innerHTML = `<section class="asset reminder">
    ${brand()}
    <div class="copy">
      <p class="kicker">A FRIENDLY DAILY NUDGE</p>
      <h1>Your habit,<br><span>made easy.</span></h1>
      <p>Choose your time. Palavra Quest brings your three-minute mission right to Chrome.</p>
      <span class="pill">🔔 Quiet after you practise</span>
    </div>
    <div class="reminder-stage">
      <div class="popup-shell"><iframe id="settingsFrame" title="Daily reminder settings"></iframe></div>
      <div class="nudge-shell"><iframe src="/extensions/palavra-quest-reminder/reminder.html" title="Daily reminder"></iframe></div>
    </div>
    <div class="ring"></div>
  </section>`;

  const frame = document.querySelector('#settingsFrame');
  frame.srcdoc = await popupSource();
  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    doc.querySelector('#statusTitle').textContent = 'Three minutes today';
    doc.querySelector('#statusDetail').textContent = '0 sec practised · 3 min to go';
    doc.querySelector('#enabled').checked = true;
    doc.querySelector('#reminderTime').value = '19:00';
    doc.querySelector('#nextReminder').textContent = 'Next reminder: today at 19:00.';
    doc.querySelector('#quietNote').textContent = 'Once you finish three minutes, the reminder stays quiet for the rest of the day.';
  });
}

function renderPromo() {
  artboard.innerHTML = `<section class="asset promo">
    <div class="promo-copy">
      <div class="promo-brand"><img src="${icon}" alt=""><span>palavra<b>quest</b></span></div>
      <h1>Three minutes.<br><span>Every day.</span></h1>
      <div class="promo-meta"><span>FREE</span><span>EUROPEAN PT 🇵🇹</span></div>
    </div>
    <div class="promo-star">★</div>
  </section>`;
}

function renderMarquee() {
  artboard.innerHTML = `<section class="asset marquee">
    <div class="promo-copy">
      <div class="promo-brand"><img src="${icon}" alt=""><span>palavra<b>quest</b></span></div>
      <h1>Three minutes.<br><span>Real Portuguese.</span></h1>
      <div class="promo-meta"><span>FREE</span><span>ADAPTIVE PRACTICE</span><span>EUROPEAN PT 🇵🇹</span></div>
    </div>
    <div class="marquee-world">
      <div class="marquee-planet"></div>
      <div class="marquee-star">★</div>
      <div class="marquee-card"><strong>🇵🇹 PORTUGAL</strong><span>Your daily vocabulary adventure</span></div>
    </div>
  </section>`;
}

if (asset === 'promo') renderPromo();
else if (asset === 'marquee') renderMarquee();
else if (asset === 'reminder') void renderReminder();
else renderScreenshot(asset);
