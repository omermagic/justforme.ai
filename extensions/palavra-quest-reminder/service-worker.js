'use strict';

const ALARM_NAME = 'palavra-quest-daily-reminder';
const NOTIFICATION_ID = 'palavra-quest-daily';
const QUEST_URL = 'https://justforme.ai/learn/portuguese/?from=chrome-extension';
const MAX_ON_TIME_DELAY_MS = 60 * 1000;
const QUIET_ICONS = Object.freeze({
  16: 'icons/icon16.png',
  32: 'icons/icon32.png',
  48: 'icons/icon48.png',
  128: 'icons/icon128.png'
});
const GO_ICONS = Object.freeze({
  16: 'icons/go16.png',
  32: 'icons/go32.png',
  48: 'icons/go48.png',
  128: 'icons/go128.png'
});
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
    'lastReminderDate',
    'nextReminderAt',
    'forceReminderAt',
    'lastAlarmFiredAt',
    'missedReminderAt'
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
    lastReminderDate: saved.lastReminderDate || '',
    nextReminderAt: Math.max(0, Number(saved.nextReminderAt) || 0),
    forceReminderAt: Math.max(0, Number(saved.forceReminderAt) || 0),
    lastAlarmFiredAt: Math.max(0, Number(saved.lastAlarmFiredAt) || 0),
    missedReminderAt: Math.max(0, Number(saved.missedReminderAt) || 0)
  };
}

function alarmArrivedLate(alarm, now = Date.now()) {
  const scheduledTime = Number(alarm?.scheduledTime) || 0;
  return scheduledTime > 0 && now - scheduledTime > MAX_ON_TIME_DELAY_MS;
}

function missedStoredReminder(model, now = Date.now()) {
  const scheduledTime = Number(model.nextReminderAt) || 0;
  if (!model.settings.enabled || scheduledTime <= 0 || scheduledTime > now) return false;
  if (model.lastAlarmFiredAt >= scheduledTime) return false;
  return model.completedDate !== localDay(new Date(scheduledTime));
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

function nextReminderTimestamp(reminderTime, now = new Date(), allowCurrentMinute = true) {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const next = new Date(now);
  // Selecting the current minute is a common way to test the reminder. Since
  // the time input has no seconds, fire shortly instead of waiting until
  // tomorrow because HH:MM:00 has technically already passed.
  if (allowCurrentMinute && hours === now.getHours() && minutes === now.getMinutes()) return now.getTime() + 5000;
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime();
}

async function scheduleNextReminder(allowCurrentMinute = true) {
  const { settings } = await storedModel();
  await chrome.alarms.clear(ALARM_NAME);
  if (!settings.enabled) {
    await chrome.storage.local.set({ nextReminderAt: 0 });
    return 0;
  }
  const when = nextReminderTimestamp(settings.reminderTime, new Date(), allowCurrentMinute);
  chrome.alarms.create(ALARM_NAME, {
    when
  });
  await chrome.storage.local.set({ nextReminderAt: when });
  return when;
}

async function updateBadge() {
  const model = await storedModel();
  const complete = model.completedDate === model.todayDate || model.todaySeconds >= 180;
  const reminderSent = model.lastReminderDate === model.todayDate;
  const needsAttention = model.settings.enabled && !complete && (model.missedReminderAt > 0 || reminderSent);
  await chrome.action.setIcon({ path: needsAttention ? GO_ICONS : QUIET_ICONS });
  if (!model.settings.enabled) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }
  if (await notificationPermission() === 'denied') {
    await chrome.action.setBadgeBackgroundColor({ color: '#c24756' });
    await chrome.action.setBadgeText({ text: '!' });
    return;
  }
  await chrome.action.setBadgeBackgroundColor({ color: complete ? '#16866f' : needsAttention ? '#c95d39' : '#d58b20' });
  await chrome.action.setBadgeText({ text: complete ? '✓' : needsAttention ? 'GO' : '3m' });
}

async function initialize() {
  const model = await storedModel();
  const missedReminderAt = missedStoredReminder(model) ? model.nextReminderAt : model.missedReminderAt;
  await chrome.storage.local.set({
    settings: model.settings,
    todayDate: model.todayDate,
    todaySeconds: model.todaySeconds,
    missedReminderAt
  });
  // Startup must never turn a missed alarm into the five-second current-minute
  // test reminder. That shortcut is reserved for an explicit settings change.
  await scheduleNextReminder(false);
  await updateBadge();
}

async function openQuest() {
  await chrome.tabs.create({ url: QUEST_URL });
  await chrome.notifications.clear(NOTIFICATION_ID);
}

async function openReminderWindow() {
  try {
    await chrome.windows.create({
      url: chrome.runtime.getURL('reminder.html'),
      type: 'popup',
      width: 420,
      height: 570,
      focused: true
    });
    return true;
  } catch {
    return false;
  }
}

async function openReminderPopup() {
  if (typeof chrome.action.openPopup !== 'function') return openReminderWindow();
  try {
    await chrome.action.setPopup({ popup: 'reminder.html' });
    await chrome.action.openPopup();
    return true;
  } catch {
    await chrome.action.setPopup({ popup: 'popup.html' });
    return openReminderWindow();
  }
}

async function showDailyReminder(alarm) {
  const model = await storedModel();
  const completed = model.completedDate === model.todayDate || model.todaySeconds >= 180;
  const scheduledTime = Number(alarm?.scheduledTime) || Date.now();
  const manuallyArmed = model.forceReminderAt > 0 && Math.abs(model.forceReminderAt - scheduledTime) < 60000;
  if (!model.settings.enabled || (!manuallyArmed && (completed || model.lastReminderDate === model.todayDate))) return false;

  const popupOpened = await openReminderPopup();
  let notificationShown = false;
  if (await notificationPermission() === 'granted') {
    try {
      await chrome.notifications.create(NOTIFICATION_ID, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Three minutes of Portuguese? 🇵🇹',
        message: 'Keep your streak alive with one quick Palavra Quest mission.',
        buttons: [{ title: 'Start today’s quest' }],
        priority: 2,
        requireInteraction: true
      });
      notificationShown = true;
    } catch {
      notificationShown = false;
    }
  }
  await chrome.storage.local.set({
    lastReminderDate: model.todayDate,
    lastAlarmFiredAt: Date.now(),
    forceReminderAt: 0
  });
  return popupOpened || notificationShown;
}

async function recordMissedReminder(alarm) {
  const model = await storedModel();
  const scheduledTime = Number(alarm?.scheduledTime) || Date.now();
  const scheduledDay = localDay(new Date(scheduledTime));
  const completed = model.completedDate === scheduledDay;
  if (!model.settings.enabled || completed || model.lastReminderDate === scheduledDay) return false;
  await chrome.storage.local.set({
    missedReminderAt: scheduledTime,
    lastAlarmFiredAt: Date.now(),
    forceReminderAt: 0
  });
  return true;
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
    update.missedReminderAt = 0;
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
    const when = await scheduleNextReminder();
    const isNearFuture = settings.enabled && when - Date.now() <= 10 * 60 * 1000;
    await chrome.storage.local.set({ forceReminderAt: isNearFuture ? when : 0 });
    await updateBadge();
    return { ok: true, model: await modelWithPermission() };
  }
  if (message.type === 'open-quest') {
    await openQuest();
    return { ok: true };
  }
  if (message.type === 'reminder-popup-opened') {
    await chrome.action.setPopup({ popup: 'popup.html' });
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
    if (alarmArrivedLate(alarm)) await recordMissedReminder(alarm);
    else await showDailyReminder(alarm);
    await scheduleNextReminder(false);
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
