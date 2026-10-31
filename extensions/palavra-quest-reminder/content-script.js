'use strict';

const ALLOWED_ORIGINS = new Set([
  'https://justforme.ai',
  'https://www.justforme.ai'
]);

window.addEventListener('message', event => {
  if (event.source !== window || !ALLOWED_ORIGINS.has(event.origin)) return;
  const message = event.data;
  if (!message || message.source !== 'palavra-quest' || message.type !== 'daily-practice') return;

  chrome.runtime.sendMessage({
    type: 'practice-status',
    date: message.date,
    seconds: message.seconds,
    complete: message.complete === true
  }).catch(() => {});
});

window.postMessage({
  source: 'palavra-quest-reminder',
  type: 'request-daily-practice'
}, window.location.origin);
