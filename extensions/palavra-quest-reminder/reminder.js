'use strict';

document.querySelector('#startQuest').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'open-quest' });
  window.close();
});

document.querySelector('#dismiss').addEventListener('click', () => window.close());
window.focus();
