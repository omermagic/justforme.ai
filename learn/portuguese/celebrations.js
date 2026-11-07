'use strict';

window.PalavraCelebration = (() => {
  const STREAK_LEAVE_MS = 1050;
  const STREAK_REMOVE_MS = 1450;
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
      window.setTimeout(() => celebration.classList.add('leaving'), STREAK_LEAVE_MS);
      window.setTimeout(() => celebration.remove(), STREAK_REMOVE_MS);
    }
    return { index, message, element: celebration, durationMs: persistentPreview ? 0 : STREAK_REMOVE_MS };
  }

  function dayStreakMessage(days) {
    if(days>=300)return 'Lendário! O teu português já faz parte da tua vida!';
    if(days>=100)return 'Extraordinário! Uma centena de dias em português!';
    if(days>=80)return 'Incrível! O hábito está mais forte do que nunca!';
    if(days>=40)return 'Fantástico! Quarenta dias de verdadeira dedicação!';
    if(days>=20)return 'Espetacular! Vinte dias sempre a avançar!';
    if(days>=10)return 'Muito bem! Dez dias seguidos em português!';
    return 'Parabéns! A tua aventura diária começou em grande!';
  }

  function showDayStreak(days, persistentPreview = false) {
    const count=Math.max(1,Math.floor(Number(days)||1));
    document.querySelector('#streakCelebration')?.remove();
    const celebration=document.createElement('section');
    celebration.id='streakCelebration';
    celebration.className='streak-celebration daily-streak-celebration';
    celebration.setAttribute('role','status');
    celebration.setAttribute('aria-live','polite');
    celebration.innerHTML=`
      <div class="streak-rays" aria-hidden="true"></div>
      <div class="streak-card">
        <span class="streak-emoji" aria-hidden="true">${count>=100?'🏆':count>=40?'🇵🇹':'🔥'}</span>
        <small>${count} DIAS SEGUIDOS</small>
        <strong>${dayStreakMessage(count)}</strong>
      </div>
      <div class="streak-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
    document.body.append(celebration);
    if(persistentPreview)celebration.classList.add('preview');
    else{
      window.setTimeout(()=>celebration.classList.add('leaving'),2000);
      window.setTimeout(()=>celebration.remove(),2400);
    }
    return celebration;
  }

  if (['127.0.0.1', 'localhost'].includes(location.hostname) && new URLSearchParams(location.search).has('celebration-preview')) {
    window.addEventListener('load', () => window.setTimeout(() => show(20, -1, Math.random, true), 300), { once: true });
  }

  return Object.freeze({ messages, pick, isMilestone, nextStreak, sessionStartStreak, show, dayStreakMessage, showDayStreak });
})();
