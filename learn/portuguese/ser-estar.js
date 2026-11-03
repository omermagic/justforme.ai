'use strict';

window.SerEstarTrainer = (() => {
  const FOCUS_SECONDS = 90;
  const MASTERY_WINDOW = 12;
  const MASTERY_CORRECT = 11;
  // These lookup values are deliberately accent-free because family() first
  // normalizes learner input, allowing either typed or button-selected forms.
  const SER_FORMS = new Set(['ser', 'sou', 'es', 'e', 'somos', 'sao', 'era', 'eras', 'eramos', 'eram']);
  const ESTAR_FORMS = new Set(['estar', 'estou', 'estas', 'esta', 'estamos', 'estao', 'estava', 'estavas', 'estavamos', 'estavam']);

  const cards = Object.freeze([
    { id:'identity-origin', target:'ser', answer:'sou', sentence:'Eu ___ de Lisboa.', hint:'I am from Lisbon.', options:['sou','estou','tenho','fico'], explanation:'Use ser for origin: eu sou de Lisboa.' },
    { id:'temporary-location', target:'estar', answer:'estou', sentence:'Eu ___ em Lisboa esta semana.', hint:'I am in Lisbon this week.', options:['estou','sou','tenho','fico'], explanation:'Use estar for a person’s location: eu estou em Lisboa.' },
    { id:'identity-friend', target:'ser', answer:'és', sentence:'Tu ___ o meu melhor amigo.', hint:'You are my best friend.', options:['és','estás','tens','ficas'], explanation:'Use ser for identity and relationships: tu és o meu amigo.' },
    { id:'temporary-tired', target:'estar', answer:'estás', sentence:'Tu ___ com sono depois da viagem.', hint:'You are sleepy after the journey.', options:['estás','és','tens','ficas'], explanation:'Use estar for a temporary condition: tu estás com sono.' },
    { id:'profession', target:'ser', answer:'é', sentence:'A Marta ___ médica.', hint:'Marta is a doctor.', options:['é','está','tem','fica'], explanation:'Use ser for a profession: a Marta é médica.' },
    { id:'temporary-feeling', target:'estar', answer:'está', sentence:'A Marta ___ contente hoje.', hint:'Marta is happy today.', options:['está','é','tem','fica'], explanation:'Use estar for a current feeling: a Marta está contente.' },
    { id:'defining-quality', target:'ser', answer:'é', sentence:'Este livro ___ muito interessante.', hint:'This book is very interesting.', options:['é','está','tem','fica'], explanation:'Use ser for a defining characteristic: o livro é interessante.' },
    { id:'object-location', target:'estar', answer:'está', sentence:'Este livro ___ em cima da mesa.', hint:'This book is on the table.', options:['está','é','tem','fica'], explanation:'Use estar for location: o livro está em cima da mesa.' },
    { id:'material', target:'ser', answer:'é', sentence:'A mesa ___ de madeira.', hint:'The table is made of wood.', options:['é','está','tem','fica'], explanation:'Use ser for material: a mesa é de madeira.' },
    { id:'current-condition', target:'estar', answer:'está', sentence:'A mesa ___ limpa agora.', hint:'The table is clean now.', options:['está','é','tem','fica'], explanation:'Use estar for a current condition: a mesa está limpa.' },
    { id:'day', target:'ser', answer:'é', sentence:'Hoje ___ segunda-feira.', hint:'Today is Monday.', options:['é','está','tem','fica'], explanation:'Use ser for the day and date: hoje é segunda-feira.' },
    { id:'weather', target:'estar', answer:'está', sentence:'Hoje ___ muito frio.', hint:'It is very cold today.', options:['está','é','tem','fica'], explanation:'Use estar for the current weather: hoje está frio.' },
    { id:'event-time', target:'ser', answer:'é', sentence:'O jantar ___ às oito.', hint:'Dinner is at eight.', options:['é','está','tem','fica'], explanation:'Use ser for an event’s time: o jantar é às oito.' },
    { id:'ready-state', target:'estar', answer:'está', sentence:'O jantar ___ pronto.', hint:'Dinner is ready.', options:['está','é','tem','fica'], explanation:'Use estar for a resulting state: o jantar está pronto.' },
    { id:'group-identity', target:'ser', answer:'somos', sentence:'Nós ___ estudantes.', hint:'We are students.', options:['somos','estamos','temos','ficamos'], explanation:'Use ser for identity: nós somos estudantes.' },
    { id:'group-location', target:'estar', answer:'estamos', sentence:'Nós ___ na biblioteca agora.', hint:'We are in the library now.', options:['estamos','somos','temos','ficamos'], explanation:'Use estar for location: nós estamos na biblioteca.' },
    { id:'family-relationship', target:'ser', answer:'são', sentence:'O Tiago e o Rui ___ irmãos.', hint:'Tiago and Rui are brothers.', options:['são','estão','têm','ficam'], explanation:'Use ser for family relationships: eles são irmãos.' },
    { id:'current-worry', target:'estar', answer:'estão', sentence:'Eles ___ preocupados com o exame.', hint:'They are worried about the exam.', options:['estão','são','têm','ficam'], explanation:'Use estar for a current emotion: eles estão preocupados.' },
    { id:'ownership', target:'ser', answer:'são', sentence:'Estas chaves ___ minhas.', hint:'These keys are mine.', options:['são','estão','têm','ficam'], explanation:'Use ser for ownership: as chaves são minhas.' },
    { id:'keys-location', target:'estar', answer:'estão', sentence:'As chaves ___ dentro da mochila.', hint:'The keys are inside the backpack.', options:['estão','são','têm','ficam'], explanation:'Use estar for location: as chaves estão na mochila.' },
    { id:'past-trait', target:'ser', answer:'era', sentence:'Quando era criança, eu ___ muito tímido.', hint:'When I was a child, I was very shy.', options:['era','estava','tinha','ficava'], explanation:'Use ser for a past characteristic: eu era tímido.' },
    { id:'past-state', target:'estar', answer:'estava', sentence:'Ontem, eu ___ doente.', hint:'Yesterday, I was ill.', options:['estava','era','tinha','ficava'], explanation:'Use estar for a past temporary state: eu estava doente.' },
    { id:'event-place', target:'ser', answer:'é', sentence:'A reunião ___ na sala dois.', hint:'The meeting is in room two.', options:['é','está','tem','fica'], explanation:'Use ser for where an event takes place: a reunião é na sala dois.' },
    { id:'building-condition', target:'estar', answer:'está', sentence:'O museu ___ fechado para obras.', hint:'The museum is closed for building work.', options:['está','é','tem','fica'], explanation:'Use estar for a temporary condition: o museu está fechado.' },
    { id:'essential-quality', target:'ser', answer:'é', sentence:'A água ___ essencial à vida.', hint:'Water is essential to life.', options:['é','está','tem','fica'], explanation:'Use ser for an essential quality: a água é essencial.' },
    { id:'temperature-state', target:'estar', answer:'está', sentence:'A água ___ demasiado quente para beber.', hint:'The water is too hot to drink.', options:['está','é','tem','fica'], explanation:'Use estar for a current temperature: a água está quente.' },
    { id:'plural-profession', target:'ser', answer:'são', sentence:'A Inês e o Pedro ___ professores.', hint:'Inês and Pedro are teachers.', options:['são','estão','têm','ficam'], explanation:'Use ser for professions: eles são professores.' },
    { id:'plural-delay', target:'estar', answer:'estão', sentence:'A Inês e o Pedro ___ atrasados hoje.', hint:'Inês and Pedro are late today.', options:['estão','são','têm','ficam'], explanation:'Use estar for a temporary situation: eles estão atrasados.' }
  ]);

  function norm(value) {
    return String(value || '').toLocaleLowerCase('pt-PT').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  }

  function family(value) {
    const normalized = norm(value);
    if (SER_FORMS.has(normalized)) return 'ser';
    if (ESTAR_FORMS.has(normalized)) return 'estar';
    return '';
  }

  function normalizeState(raw = {}) {
    const recent = Array.isArray(raw.recent) ? raw.recent.slice(-6).map(value => value ? 1 : 0) : [];
    const trainingResults = Array.isArray(raw.trainingResults) ? raw.trainingResults.slice(-16).filter(result => result&&['ser','estar'].includes(result.target)).map(result=>({target:result.target,right:Boolean(result.right)})) : [];
    return {
      recent,
      focusRemaining: Math.min(FOCUS_SECONDS, Math.max(0, Number(raw.focusRemaining) || 0)),
      needsTraining: Boolean(raw.needsTraining||Number(raw.focusRemaining)>0),
      trainingResults,
      masteredAt: Math.max(0, Number(raw.masteredAt) || 0),
      lastTriggeredWrongCount: Math.max(0, Math.floor(Number(raw.lastTriggeredWrongCount) || 0))
    };
  }

  function wrongEvidence(words = {}) {
    return Math.max(0, Number(words.ser?.wrong) || 0) + Math.max(0, Number(words.estar?.wrong) || 0);
  }

  function shouldBegin(state, words = {}) {
    const wrong = wrongEvidence(words);
    return !state.needsTraining && wrong >= 2 && wrong > state.lastTriggeredWrongCount;
  }

  function noteAttempt(state, { target, given, right }) {
    if (target !== 'ser' && target !== 'estar') return false;
    state.recent.push(right ? 1 : 0);
    state.recent = state.recent.slice(-6);
    if (state.needsTraining) return false;
    const givenFamily = family(given);
    const directConfusion = !right && givenFamily && givenFamily !== target;
    const recentMistakes = state.recent.filter(value => value === 0).length;
    const repeatedDifficulty = state.recent.length >= 4 && recentMistakes >= 2;
    return Boolean(directConfusion || repeatedDifficulty);
  }

  function begin(state, totalWrong) {
    state.needsTraining = true;
    state.focusRemaining = FOCUS_SECONDS;
    state.trainingResults = [];
    state.lastTriggeredWrongCount = Math.max(state.lastTriggeredWrongCount, Math.floor(Number(totalWrong) || 0));
  }

  function startMission(state) {
    if (state.needsTraining) state.focusRemaining = FOCUS_SECONDS;
    return state.focusRemaining;
  }

  function noteTrainingResult(state, target, right) {
    if (target !== 'ser' && target !== 'estar') return;
    state.trainingResults.push({ target, right: Boolean(right) });
    state.trainingResults = state.trainingResults.slice(-16);
  }

  function isAmazing(state) {
    const results = state.trainingResults.slice(-MASTERY_WINDOW);
    if (results.length < MASTERY_WINDOW) return false;
    const correct = results.filter(result => result.right).length;
    const serQuestions = results.filter(result => result.target === 'ser').length;
    const estarQuestions = results.filter(result => result.target === 'estar').length;
    return correct >= MASTERY_CORRECT && serQuestions >= 4 && estarQuestions >= 4;
  }

  function spend(state, seconds, now = Date.now()) {
    const before = state.focusRemaining;
    state.focusRemaining = Math.max(0, before - Math.max(0, Number(seconds) || 0));
    if (before > 0 && state.focusRemaining === 0 && isAmazing(state)) {
      state.needsTraining = false;
      state.masteredAt = now;
      state.recent = [];
    }
    return state.focusRemaining;
  }

  function nextCard(previousId = '', random = Math.random) {
    const pool = cards.filter(card => card.id !== previousId);
    return pool[Math.floor(random() * pool.length)];
  }

  return Object.freeze({ FOCUS_SECONDS, MASTERY_WINDOW, MASTERY_CORRECT, cards, family, normalizeState, wrongEvidence, shouldBegin, noteAttempt, begin, startMission, noteTrainingResult, isAmazing, spend, nextCard });
})();
