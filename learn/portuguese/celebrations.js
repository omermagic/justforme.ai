'use strict';

window.PalavraCelebration = (() => {
  const messages = Object.freeze([
    { emoji: '🔥', title: 'Parabéns! Estás imparável!' },
    { emoji: '✨', title: 'Excelente! Que sequência incrível!' },
    { emoji: '🚀', title: 'Muito bem! Continua assim!' },
    { emoji: '🏆', title: 'Fantástico! Vinte respostas certas!' },
    { emoji: '🌟', title: 'Brilhante! O teu português está a crescer!' },
    { emoji: '🎉', title: 'Que maravilha! Estás em grande!' },
    { emoji: '💫', title: 'Espetacular! Não pares agora!' },
    { emoji: '🇵🇹', title: 'Força! Estás a falar cada vez melhor!' },
    { emoji: '⚡', title: 'Impressionante! Que grande série!' },
    { emoji: '🥳', title: 'Boa! O teu esforço está a resultar!' },
    { emoji: '🧠', title: 'Magnífico! A memória está afiada!' },
    { emoji: '💚', title: 'Incrível! Mais perto da fluência!' }
  ]);

  function pick(lastIndex = -1, random = Math.random) {
    const previous = Number.isInteger(lastIndex) ? lastIndex : -1;
    if (messages.length < 2) return 0;
    const offset = 1 + Math.floor(random() * (messages.length - 1));
    return (Math.max(-1, previous) + offset) % messages.length;
  }

  function isMilestone(count) {
    return Number.isInteger(count) && count > 0 && count % 20 === 0;
  }

  function nextStreak(current, correct) {
    if (!correct) return 0;
    return Math.max(0, Math.floor(Number(current) || 0)) + 1;
  }

  function sessionStartStreak(current) {
    return Math.min(Math.max(0, Math.floor(Number(current) || 0)), 10);
  }

  function show(count, lastIndex = -1, random = Math.random, persistentPreview = false) {
    document.querySelector('#streakCelebration')?.remove();
    const index = pick(lastIndex, random);
    const message = messages[index];
    const celebration = document.createElement('section');
    celebration.id = 'streakCelebration';
    celebration.className = 'streak-celebration';
    celebration.setAttribute('role', 'status');
    celebration.setAttribute('aria-live', 'polite');
    celebration.innerHTML = `
      <div class="streak-rays" aria-hidden="true"></div>
      <div class="streak-card">
        <span class="streak-emoji" aria-hidden="true">${message.emoji}</span>
        <small>${Math.max(20, Math.floor(Number(count) || 20))} CERTAS SEGUIDAS</small>
        <strong>${message.title}</strong>
      </div>
      <div class="streak-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
    document.body.append(celebration);
    if (persistentPreview) celebration.classList.add('preview');
    else {
      window.setTimeout(() => celebration.classList.add('leaving'), 1050);
      window.setTimeout(() => celebration.remove(), 1450);
    }
    return { index, message, element: celebration };
  }

  if (['127.0.0.1', 'localhost'].includes(location.hostname) && new URLSearchParams(location.search).has('celebration-preview')) {
    window.addEventListener('load', () => window.setTimeout(() => show(20, -1, Math.random, true), 300), { once: true });
  }

  return Object.freeze({ messages, pick, isMilestone, nextStreak, sessionStartStreak, show });
})();
