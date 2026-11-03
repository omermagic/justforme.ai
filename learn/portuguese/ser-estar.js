'use strict';

window.SerEstarTrainer = (() => {
  const FOCUS_SECONDS = 90;
  const MASTERY_WINDOW = 12;
  const MASTERY_CORRECT = 11;
  const CARD_HISTORY_LIMIT = 100;
  const DAILY_FOCUS_LIMIT_SECONDS = 6 * 60;
  // These lookup values are deliberately accent-free because family() first
  // normalizes learner input, allowing either typed or button-selected forms.
  const SER_FORMS = new Set(['ser', 'sou', 'es', 'e', 'somos', 'sao', 'era', 'eras', 'eramos', 'eram']);
  const ESTAR_FORMS = new Set(['estar', 'estou', 'estas', 'esta', 'estamos', 'estao', 'estava', 'estavas', 'estavamos', 'estavam']);

  const CORE_CARDS = [
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
  ];

  const FORM_OPTIONS = Object.freeze({
    sou:['sou','estou','tenho','fico'], estou:['estou','sou','tenho','fico'],
    és:['és','estás','tens','ficas'], estás:['estás','és','tens','ficas'],
    é:['é','está','tem','fica'], está:['está','é','tem','fica'],
    somos:['somos','estamos','temos','ficamos'], estamos:['estamos','somos','temos','ficamos'],
    são:['são','estão','têm','ficam'], estão:['estão','são','têm','ficam'],
    era:['era','estava','tinha','ficava'], estava:['estava','era','tinha','ficava'],
    eram:['eram','estavam','tinham','ficavam'], estavam:['estavam','eram','tinham','ficavam']
  });

  // A large, curated bank makes the 100-question exclusion window real. Each
  // row is [id, target, answer, Portuguese sentence, English hint, usage].
  const EXTRA_SCENARIOS = [
    ['eu-origin-valbom','ser','sou','Eu ___ de Valbom.','I am from Valbom.','origin'],
    ['eu-profession-music','ser','sou','Eu ___ professor de música.','I am a music teacher.','a profession'],
    ['eu-family-brother','ser','sou','Eu ___ o irmão da Leonor.','I am Leonor’s brother.','a family relationship'],
    ['eu-role-project','ser','sou','Eu ___ responsável pelo projeto.','I am responsible for the project.','a role'],
    ['eu-trait-patient','ser','sou','Eu ___ paciente por natureza.','I am patient by nature.','a defining trait'],
    ['eu-owner-bike','ser','sou','Eu ___ o dono desta bicicleta.','I am the owner of this bicycle.','ownership'],
    ['eu-member-club','ser','sou','Eu ___ membro do clube.','I am a member of the club.','membership'],
    ['eu-nationality-portuguese','ser','sou','Eu ___ português.','I am Portuguese.','nationality'],
    ['eu-location-home','estar','estou','Eu ___ em casa agora.','I am at home now.','current location'],
    ['eu-state-nervous','estar','estou','Eu ___ nervoso antes da entrevista.','I am nervous before the interview.','a current feeling'],
    ['eu-state-ready','estar','estou','Eu ___ pronto para sair.','I am ready to leave.','a current state'],
    ['eu-condition-hungry','estar','estou','Eu ___ com fome.','I am hungry.','a temporary condition'],
    ['eu-holiday-week','estar','estou','Eu ___ de férias esta semana.','I am on holiday this week.','a temporary situation'],
    ['eu-position-window','estar','estou','Eu ___ sentado junto à janela.','I am sitting by the window.','a current position'],
    ['eu-busy-morning','estar','estou','Eu ___ ocupado esta manhã.','I am busy this morning.','a temporary state'],
    ['eu-waiting-bus','estar','estou','Eu ___ à espera do autocarro.','I am waiting for the bus.','a current action or situation'],

    ['tu-origin-valbom','ser','és','Tu ___ de Valbom.','You are from Valbom.','origin'],
    ['tu-profession-engineer','ser','és','Tu ___ engenheiro.','You are an engineer.','a profession'],
    ['tu-trait-generous','ser','és','Tu ___ muito generoso.','You are very generous.','a defining trait'],
    ['tu-role-captain','ser','és','Tu ___ o capitão da equipa.','You are the team captain.','a role'],
    ['tu-family-cousin','ser','és','Tu ___ o meu primo.','You are my cousin.','a family relationship'],
    ['tu-role-reservation','ser','és','Tu ___ responsável pela reserva.','You are responsible for the booking.','a role'],
    ['tu-identity-right-person','ser','és','Tu ___ a pessoa certa para este trabalho.','You are the right person for this job.','identity'],
    ['tu-identity-vegetarian','ser','és','Tu ___ vegetariano.','You are vegetarian.','a defining characteristic'],
    ['tu-location-garden','estar','estás','Tu ___ no jardim agora.','You are in the garden now.','current location'],
    ['tu-state-tired','estar','estás','Tu ___ cansado hoje.','You are tired today.','a temporary condition'],
    ['tu-state-hurry','estar','estás','Tu ___ com pressa.','You are in a hurry.','a temporary condition'],
    ['tu-ready-exam','estar','estás','Tu ___ pronto para o exame.','You are ready for the exam.','a current state'],
    ['tu-state-silent','estar','estás','Tu ___ em silêncio.','You are silent.','a current state'],
    ['tu-mood-morning','estar','estás','Tu ___ de bom humor esta manhã.','You are in a good mood this morning.','a current mood'],
    ['tu-position-seat','estar','estás','Tu ___ sentado no lugar certo.','You are sitting in the right place.','a current position'],
    ['tu-location-station','estar','estás','Tu ___ perto da estação.','You are near the station.','current location'],

    ['singular-profession-architect','ser','é','O Rui ___ arquiteto.','Rui is an architect.','a profession'],
    ['singular-origin-braga','ser','é','A Ana ___ de Braga.','Ana is from Braga.','origin'],
    ['singular-ownership-coat','ser','é','Este casaco ___ meu.','This coat is mine.','ownership'],
    ['singular-event-tomorrow','ser','é','A festa ___ amanhã.','The party is tomorrow.','an event’s date'],
    ['singular-trait-bridge','ser','é','A ponte ___ muito antiga.','The bridge is very old.','a defining characteristic'],
    ['singular-material-ring','ser','é','O anel ___ de prata.','The ring is made of silver.','material'],
    ['singular-family-aunt','ser','é','A Teresa ___ minha tia.','Teresa is my aunt.','a family relationship'],
    ['singular-price-coffee','ser','é','O café aqui ___ barato.','Coffee here is inexpensive.','a general characteristic'],
    ['singular-location-office','estar','está','O Rui ___ no escritório.','Rui is in the office.','current location'],
    ['singular-feeling-worried','estar','está','A Ana ___ preocupada com o voo.','Ana is worried about the flight.','a current feeling'],
    ['singular-condition-coat','estar','está','O casaco ___ molhado.','The coat is wet.','a current condition'],
    ['singular-party-organised','estar','está','A festa ___ bem organizada.','The party is well organised.','a resulting state'],
    ['singular-bridge-closed','estar','está','A ponte ___ fechada hoje.','The bridge is closed today.','a temporary condition'],
    ['singular-ring-location','estar','está','O anel ___ na gaveta.','The ring is in the drawer.','location'],
    ['singular-phone-call','estar','está','A Teresa ___ ao telefone.','Teresa is on the phone.','a current situation'],
    ['singular-coffee-temperature','estar','está','O café ___ demasiado quente.','The coffee is too hot.','a current temperature'],

    ['nos-nationality','ser','somos','Nós ___ portugueses.','We are Portuguese.','nationality'],
    ['nos-relationship-colleagues','ser','somos','Nós ___ colegas de trabalho.','We are colleagues.','a relationship'],
    ['nos-role-responsible','ser','somos','Nós ___ responsáveis pela visita.','We are responsible for the visit.','a role'],
    ['nos-origin-valbom','ser','somos','Nós ___ de Valbom.','We are from Valbom.','origin'],
    ['nos-relationship-neighbours','ser','somos','Nós ___ vizinhos.','We are neighbours.','a relationship'],
    ['nos-identity-team','ser','somos','Nós ___ uma equipa forte.','We are a strong team.','group identity'],
    ['nos-position-first','ser','somos','Nós ___ os primeiros da fila.','We are first in the queue.','identity'],
    ['nos-trait-punctual','ser','somos','Nós ___ muito pontuais.','We are very punctual.','a defining trait'],
    ['nos-location-porto','estar','estamos','Nós ___ no Porto agora.','We are in Porto now.','current location'],
    ['nos-state-tired','estar','estamos','Nós ___ cansados depois da caminhada.','We are tired after the walk.','a temporary condition'],
    ['nos-state-ready','estar','estamos','Nós ___ prontos para começar.','We are ready to begin.','a current state'],
    ['nos-situation-meeting','estar','estamos','Nós ___ em reunião.','We are in a meeting.','a current situation'],
    ['nos-holiday-august','estar','estamos','Nós ___ de férias em agosto.','We are on holiday in August.','a temporary situation'],
    ['nos-delay-traffic','estar','estamos','Nós ___ atrasados por causa do trânsito.','We are late because of traffic.','a temporary situation'],
    ['nos-position-terrace','estar','estamos','Nós ___ sentados na esplanada.','We are sitting on the terrace.','a current position'],
    ['nos-feeling-worried','estar','estamos','Nós ___ preocupados com o resultado.','We are worried about the result.','a current feeling'],

    ['plural-profession-parents','ser','são','Os meus pais ___ professores.','My parents are teachers.','a profession'],
    ['plural-price-tickets','ser','são','Os bilhetes ___ caros.','The tickets are expensive.','a general characteristic'],
    ['plural-trait-houses','ser','são','Estas casas ___ antigas.','These houses are old.','a defining characteristic'],
    ['plural-family-cousins','ser','são','A Joana e a Rita ___ primas.','Joana and Rita are cousins.','a family relationship'],
    ['plural-material-shoes','ser','são','Os sapatos ___ de couro.','The shoes are made of leather.','material'],
    ['plural-event-wednesdays','ser','são','As reuniões ___ às quartas-feiras.','The meetings are on Wednesdays.','a regular event time'],
    ['plural-importance-documents','ser','são','Estes documentos ___ importantes.','These documents are important.','a defining quality'],
    ['plural-trait-dogs','ser','são','Os cães ___ animais leais.','Dogs are loyal animals.','a general characteristic'],
    ['plural-location-parents','estar','estão','Os meus pais ___ no Algarve esta semana.','My parents are in the Algarve this week.','current location'],
    ['plural-location-tickets','estar','estão','Os bilhetes ___ dentro da carteira.','The tickets are inside the wallet.','location'],
    ['plural-condition-houses','estar','estão','Estas casas ___ vazias este mês.','These houses are empty this month.','a temporary condition'],
    ['plural-location-cinema','estar','estão','A Joana e a Rita ___ no cinema.','Joana and Rita are at the cinema.','current location'],
    ['plural-condition-shoes','estar','estão','Os sapatos ___ sujos da caminhada.','The shoes are dirty from the walk.','a current condition'],
    ['plural-event-cancelled','estar','estão','As reuniões ___ canceladas hoje.','The meetings are cancelled today.','a temporary state'],
    ['plural-documents-signed','estar','estão','Estes documentos ___ assinados.','These documents are signed.','a resulting state'],
    ['plural-dogs-asleep','estar','estão','Os cães ___ a dormir no jardim.','The dogs are sleeping in the garden.','a current situation'],

    ['past-singular-profession-grandfather','ser','era','O meu avô ___ carpinteiro.','My grandfather was a carpenter.','a past profession'],
    ['past-singular-identity-neighbour','ser','era','O senhor Manuel ___ o nosso vizinho.','Mr Manuel was our neighbour.','a past relationship'],
    ['past-singular-trait-school','ser','era','A escola ___ pequena naquele tempo.','The school was small at that time.','a past characteristic'],
    ['past-singular-trait-journey','ser','era','A viagem de comboio ___ longa.','The train journey was long.','a past characteristic'],
    ['past-singular-trait-pedro','ser','era','O Pedro ___ muito tímido na escola.','Pedro was very shy at school.','a past trait'],
    ['past-singular-function-building','ser','era','Aquele edifício ___ um hospital.','That building was a hospital.','a past function'],
    ['past-singular-quality-problem','ser','era','O problema ___ simples.','The problem was simple.','a past defining quality'],
    ['past-singular-event-dinner','ser','era','O jantar ___ às sete.','Dinner was at seven.','a past event time'],
    ['past-singular-condition-grandfather','estar','estava','O meu avô ___ doente na semana passada.','My grandfather was ill last week.','a past temporary condition'],
    ['past-singular-location-coimbra','estar','estava','Eu ___ em Coimbra naquele dia.','I was in Coimbra that day.','past location'],
    ['past-singular-school-closed','estar','estava','A escola ___ fechada durante as férias.','The school was closed during the holidays.','a past temporary condition'],
    ['past-singular-train-delay','estar','estava','O comboio ___ atrasado.','The train was delayed.','a past temporary state'],
    ['past-singular-pedro-silent','estar','estava','O Pedro ___ calado durante a reunião.','Pedro was quiet during the meeting.','a past temporary state'],
    ['past-singular-building-empty','estar','estava','Aquele edifício ___ vazio.','That building was empty.','a past condition'],
    ['past-singular-problem-solved','estar','estava','O problema já ___ resolvido.','The problem was already solved.','a past resulting state'],
    ['past-singular-dinner-cold','estar','estava','O jantar ___ frio quando chegámos.','Dinner was cold when we arrived.','a past condition'],

    ['past-plural-profession-grandparents','ser','eram','Os meus avós ___ agricultores.','My grandparents were farmers.','a past profession'],
    ['past-plural-trait-streets','ser','eram','As ruas ___ muito estreitas.','The streets were very narrow.','a past characteristic'],
    ['past-plural-trait-children','ser','eram','As crianças ___ muito curiosas.','The children were very curious.','a past trait'],
    ['past-plural-event-classes','ser','eram','As aulas ___ às nove.','Classes were at nine.','a past event time'],
    ['past-plural-material-walls','ser','eram','As paredes ___ de pedra.','The walls were made of stone.','material in the past'],
    ['past-plural-relationship-colleagues','ser','eram','O Rui e o Paulo ___ colegas.','Rui and Paulo were colleagues.','a past relationship'],
    ['past-plural-quality-books','ser','eram','Aqueles livros ___ raros.','Those books were rare.','a past defining quality'],
    ['past-plural-quality-rules','ser','eram','As regras ___ simples.','The rules were simple.','a past defining quality'],
    ['past-plural-location-grandparents','estar','estavam','Os meus avós ___ em casa ontem.','My grandparents were at home yesterday.','past location'],
    ['past-plural-streets-blocked','estar','estavam','As ruas ___ bloqueadas pela neve.','The streets were blocked by snow.','a past temporary state'],
    ['past-plural-feeling-children','estar','estavam','As crianças ___ entusiasmadas com a visita.','The children were excited about the visit.','a past feeling'],
    ['past-plural-classes-cancelled','estar','estavam','As aulas ___ canceladas naquele dia.','Classes were cancelled that day.','a past temporary state'],
    ['past-plural-walls-wet','estar','estavam','As paredes ___ molhadas depois da chuva.','The walls were wet after the rain.','a past condition'],
    ['past-plural-colleagues-busy','estar','estavam','O Rui e o Paulo ___ ocupados nessa manhã.','Rui and Paulo were busy that morning.','a past temporary state'],
    ['past-plural-books-shelf','estar','estavam','Aqueles livros ___ na prateleira de cima.','Those books were on the top shelf.','past location'],
    ['past-plural-rules-displayed','estar','estavam','As regras ___ afixadas na porta.','The rules were posted on the door.','a past resulting state']
  ];

  function makeScenarioCard([id, target, answer, sentence, hint, usage]) {
    return { id, target, answer, sentence, hint, options:FORM_OPTIONS[answer], explanation:`Use ${target} for ${usage}: ${sentence.replace('___',answer)}` };
  }

  const cards = Object.freeze([...CORE_CARDS, ...EXTRA_SCENARIOS.map(makeScenarioCard)]);

  function norm(value) {
    return String(value || '').toLocaleLowerCase('pt-PT').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  }

  function family(value) {
    const normalized = norm(value);
    if (SER_FORMS.has(normalized)) return 'ser';
    if (ESTAR_FORMS.has(normalized)) return 'estar';
    return '';
  }

  function localDayKey(now = Date.now()) {
    const date = new Date(now);
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  }

  function normalizeState(raw = {}, now = Date.now()) {
    const recent = Array.isArray(raw.recent) ? raw.recent.slice(-6).map(value => value ? 1 : 0) : [];
    const trainingResults = Array.isArray(raw.trainingResults) ? raw.trainingResults.slice(-16).filter(result => result&&['ser','estar'].includes(result.target)).map(result=>({target:result.target,right:Boolean(result.right)})) : [];
    const validCardIds = new Set(cards.map(card => card.id));
    const cardHistory = Array.isArray(raw.cardHistory) ? raw.cardHistory.filter(id => validCardIds.has(id)).slice(-CARD_HISTORY_LIMIT) : [];
    const today = localDayKey(now);
    const focusDay = today;
    const focusSecondsToday = raw.focusDay === today ? Math.min(DAILY_FOCUS_LIMIT_SECONDS, Math.max(0, Number(raw.focusSecondsToday) || 0)) : 0;
    const dailyFocusRemaining = DAILY_FOCUS_LIMIT_SECONDS - focusSecondsToday;
    return {
      recent,
      focusRemaining: Math.min(FOCUS_SECONDS, dailyFocusRemaining, Math.max(0, Number(raw.focusRemaining) || 0)),
      needsTraining: Boolean(raw.needsTraining||Number(raw.focusRemaining)>0),
      trainingResults,
      cardHistory,
      focusDay,
      focusSecondsToday,
      masteredAt: Math.max(0, Number(raw.masteredAt) || 0),
      lastTriggeredWrongCount: Math.max(0, Math.floor(Number(raw.lastTriggeredWrongCount) || 0))
    };
  }

  function syncDailyFocus(state, now = Date.now()) {
    const today = localDayKey(now);
    if (state.focusDay !== today) {
      state.focusDay = today;
      state.focusSecondsToday = 0;
      state.focusRemaining = 0;
    }
    state.focusSecondsToday = Math.min(DAILY_FOCUS_LIMIT_SECONDS, Math.max(0, Number(state.focusSecondsToday) || 0));
    return DAILY_FOCUS_LIMIT_SECONDS - state.focusSecondsToday;
  }

  function dailyFocusRemaining(state, now = Date.now()) {
    return syncDailyFocus(state, now);
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

  function begin(state, totalWrong, now = Date.now()) {
    state.needsTraining = true;
    state.focusRemaining = Math.min(FOCUS_SECONDS, dailyFocusRemaining(state, now));
    state.trainingResults = [];
    state.lastTriggeredWrongCount = Math.max(state.lastTriggeredWrongCount, Math.floor(Number(totalWrong) || 0));
  }

  function startMission(state, now = Date.now()) {
    if (state.needsTraining) state.focusRemaining = Math.min(FOCUS_SECONDS, dailyFocusRemaining(state, now));
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
    const availableToday = dailyFocusRemaining(state, now);
    const elapsed = Math.min(before, availableToday, Math.max(0, Number(seconds) || 0));
    state.focusSecondsToday = Math.min(DAILY_FOCUS_LIMIT_SECONDS, state.focusSecondsToday + elapsed);
    state.focusRemaining = Math.max(0, before - elapsed);
    if (state.focusSecondsToday >= DAILY_FOCUS_LIMIT_SECONDS) state.focusRemaining = 0;
    if (before > 0 && state.focusRemaining === 0 && isAmazing(state)) {
      state.needsTraining = false;
      state.masteredAt = now;
      state.recent = [];
    }
    return state.focusRemaining;
  }

  function nextCard(state, random = Math.random) {
    const history = Array.isArray(state?.cardHistory) ? state.cardHistory.slice(-CARD_HISTORY_LIMIT) : [];
    const excluded = new Set(history);
    const pool = cards.filter(card => !excluded.has(card.id));
    if (!pool.length) return null;
    const randomValue = Math.min(.999999999, Math.max(0, Number(random()) || 0));
    const card = pool[Math.floor(randomValue * pool.length)];
    state.cardHistory = [...history, card.id].slice(-CARD_HISTORY_LIMIT);
    return card;
  }

  return Object.freeze({ FOCUS_SECONDS, MASTERY_WINDOW, MASTERY_CORRECT, CARD_HISTORY_LIMIT, DAILY_FOCUS_LIMIT_SECONDS, cards, family, normalizeState, wrongEvidence, shouldBegin, noteAttempt, begin, startMission, noteTrainingResult, isAmazing, spend, dailyFocusRemaining, nextCard });
})();
