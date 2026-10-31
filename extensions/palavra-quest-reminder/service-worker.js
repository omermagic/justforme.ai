'use strict';

const ALARM_NAME = 'palavra-quest-daily-reminder';
const NOTIFICATION_ID = 'palavra-quest-daily';
const QUEST_URL = 'https://justforme.ai/learn/portuguese/?from=chrome-extension';
const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  reminderTime: '19:00'
});

function localDay(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function validReminderTime(value) {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

async function storedModel() {
  const saved = await chrome.storage.local.get([
    'settings',
    'completedDate',
    'todayDate',
    'todaySeconds',
    'lastReminderDate'
  ]);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(saved.settings || {})
  };
  if (!validReminderTime(settings.reminderTime)) settings.reminderTime = DEFAULT_SETTINGS.reminderTime;
  settings.enabled = settings.enabled !== false;

  const today = localDay();
  const todaySeconds = saved.todayDate === today ? Math.max(0, Number(saved.todaySeconds) || 0) : 0;
  return {
    settings,
    completedDate: saved.completedDate || '',
    todayDate: today,
    todaySeconds,
    lastReminderDate: saved.lastReminderDate || ''
  };
}

async function notificationPermission() {
  try {
    return await chrome.notifications.getPermissionLevel();
  } catch {
    return 'granted';
  }
}

async function modelWithPermission() {
  return {
    ...await storedModel(),
    notificationPermission: await notificationPermission()
  };
}

function nextReminderTimestamp(reminderTime) {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime();
}

async function scheduleNextReminder() {
  const { settings } = await storedModel();
  await chrome.alarms.clear(ALARM_NAME);
  if (!settings.enabled) return;
  chrome.alarms.create(ALARM_NAME, {
    when: nextReminderTimestamp(settings.reminderTime)
  });
}

async function updateBadge() {
  const model = await storedModel();
  if (!model.settings.enabled) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }
  if (await notificationPermission() === 'denied') {
    await chrome.action.setBadgeBackgroundColor({ color: '#c24756' });
    await chrome.action.setBadgeText({ text: '!' });
    return;
  }
  const complete = model.completedDate === model.todayDate || model.todaySeconds >= 180;
  await chrome.action.setBadgeBackgroundColor({ color: complete ? '#16866f' : '#d58b20' });
  await chrome.action.setBadgeText({ text: complete ? '✓' : '3m' });
}

async function initialize() {
  const model = await storedModel();
  await chrome.storage.local.set({
    settings: model.settings,
    todayDate: model.todayDate,
    todaySeconds: model.todaySeconds
  });
  await scheduleNextReminder();
  await updateBadge();
}

async function openQuest() {
  await chrome.tabs.create({ url: QUEST_URL });
  await chrome.notifications.clear(NOTIFICATION_ID);
}

async function showDailyReminder() {
  const model = await storedModel();
  const completed = model.completedDate === model.todayDate || model.todaySeconds >= 180;
  if (!model.settings.enabled || completed || model.lastReminderDate === model.todayDate) return;
  if (await notificationPermission() !== 'granted') {
    await updateBadge();
    return;
  }

  await chrome.notifications.create(NOTIFICATION_ID, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Three minutes of Portuguese? 🇵🇹',
    message: 'Keep your streak alive with one quick Palavra Quest mission.',
    buttons: [{ title: 'Start today’s quest' }],
    priority: 1
  });
  await chrome.storage.local.set({ lastReminderDate: model.todayDate });
}

async function handlePracticeStatus(message) {
  if (message.date !== localDay()) return storedModel();
  const seconds = Math.max(0, Math.floor(Number(message.seconds) || 0));
  const update = {
    todayDate: message.date,
    todaySeconds: seconds
  };
  if (message.complete || seconds >= 180) {
    update.completedDate = message.date;
    await chrome.notifications.clear(NOTIFICATION_ID);
  }
  await chrome.storage.local.set(update);
  await updateBadge();
  return storedModel();
}

async function handleMessage(message) {
  if (!message || typeof message !== 'object') return { ok: false };
  if (message.type === 'practice-status') {
    return { ok: true, model: await handlePracticeStatus(message) };
  }
  if (message.type === 'get-status') {
    await updateBadge();
    return { ok: true, model: await modelWithPermission() };
  }
  if (message.type === 'update-settings') {
    const current = await storedModel();
    const settings = {
      enabled: message.settings?.enabled !== false,
      reminderTime: validReminderTime(message.settings?.reminderTime)
        ? message.settings.reminderTime
        : current.settings.reminderTime
    };
    await chrome.storage.local.set({ settings });
    await scheduleNextReminder();
    await updateBadge();
    return { ok: true, model: await modelWithPermission() };
  }
  if (message.type === 'open-quest') {
    await openQuest();
    return { ok: true };
  }
  if (message.type === 'test-reminder') {
    const permission = await notificationPermission();
    if (permission !== 'granted') return { ok: true, shown: false, permission };
    await chrome.notifications.create(NOTIFICATION_ID, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Your Portuguese reminder is ready! 🇵🇹',
      message: 'This is how your daily three-minute reminder will look.',
      buttons: [{ title: 'Open Palavra Quest' }],
      priority: 1
    });
    return { ok: true, shown: true, permission };
  }
  return { ok: false };
}

chrome.runtime.onInstalled.addListener(() => void initialize());
chrome.runtime.onStartup.addListener(() => void initialize());

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== ALARM_NAME) return;
  void (async () => {
    await showDailyReminder();
    await scheduleNextReminder();
    await updateBadge();
  })();
});

chrome.notifications.onClicked.addListener(notificationId => {
  if (notificationId === NOTIFICATION_ID) void openQuest();
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === NOTIFICATION_ID && buttonIndex === 0) void openQuest();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

void initialize();
