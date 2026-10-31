'use strict';

const enabledInput = document.querySelector('#enabled');
const timeInput = document.querySelector('#reminderTime');
const statusCard = document.querySelector('#statusCard');
const statusIcon = document.querySelector('#statusIcon');
const statusTitle = document.querySelector('#statusTitle');
const statusDetail = document.querySelector('#statusDetail');
const progressBar = document.querySelector('#progressBar');
const progressFill = document.querySelector('#progressFill');
const quietNote = document.querySelector('#quietNote');
const nextReminder = document.querySelector('#nextReminder');
const permissionWarning = document.querySelector('#permissionWarning');
const notificationPreview = document.querySelector('#notificationPreview');
const savedMessage = document.querySelector('#savedMessage');
let saveMessageTimer = 0;

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatSeconds(seconds) {
  const safeSeconds = Math.max(0, Math.min(180, Math.floor(Number(seconds) || 0)));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  if (!minutes) return `${remainder} sec`;
  return remainder ? `${minutes} min ${remainder} sec` : `${minutes} min`;
}

function showSaved(message) {
  clearTimeout(saveMessageTimer);
  savedMessage.textContent = message;
  saveMessageTimer = setTimeout(() => { savedMessage.textContent = ''; }, 1800);
}

function scheduledReminderText(model, complete) {
  if (model.settings?.enabled === false) return 'No reminder scheduled.';
  if (complete) return 'No more reminders today — goal completed.';
  if (model.lastReminderDate === todayKey()) return 'Today’s reminder was sent.';
  const timestamp = Number(model.nextReminderAt) || 0;
  if (!timestamp) return 'Scheduling your next reminder…';
  const remaining = timestamp - Date.now();
  if (remaining > 0 && remaining <= 60000) return 'Next reminder: in a few seconds.';
  const date = new Date(timestamp);
  const day = date.toDateString() === new Date().toDateString() ? 'today' : 'tomorrow';
  return `Next reminder: ${day} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
}

function render(model) {
  const settings = model.settings || { enabled: true, reminderTime: '19:00' };
  const seconds = model.todayDate === todayKey() ? Math.max(0, Number(model.todaySeconds) || 0) : 0;
  const complete = model.completedDate === todayKey() || seconds >= 180;
  const percent = Math.min(100, seconds / 180 * 100);

  enabledInput.checked = settings.enabled !== false;
  timeInput.value = settings.reminderTime || '19:00';
  timeInput.disabled = !enabledInput.checked;
  statusCard.classList.toggle('complete', complete);
  statusIcon.textContent = complete ? '✅' : '⏱️';
  statusTitle.textContent = complete ? 'Today’s quest is complete!' : 'Three minutes today';
  statusDetail.textContent = complete
    ? 'Great work — your reminder will stay quiet.'
    : `${formatSeconds(seconds)} practised · ${formatSeconds(180 - seconds)} to go`;
  progressFill.style.width = `${complete ? 100 : percent}%`;
  progressBar.setAttribute('aria-valuenow', String(Math.min(180, Math.floor(seconds))));
  quietNote.textContent = enabledInput.checked
    ? 'Once you finish three minutes, the reminder stays quiet for the rest of the day.'
    : 'Daily reminders are currently paused.';
  nextReminder.textContent = scheduledReminderText(model, complete);
  permissionWarning.hidden = model.notificationPermission !== 'denied';
}

async function refresh() {
  const response = await chrome.runtime.sendMessage({ type: 'get-status' });
  if (response?.ok) render(response.model);
}

async function saveSettings() {
  const response = await chrome.runtime.sendMessage({
    type: 'update-settings',
    settings: {
      enabled: enabledInput.checked,
      reminderTime: timeInput.value
    }
  });
  if (response?.ok) {
    render(response.model);
    const firesSoon = response.model.nextReminderAt - Date.now() <= 60000;
    const message = !enabledInput.checked
      ? 'Daily reminder paused'
      : firesSoon
        ? 'Reminder will fire in a few seconds'
        : `Reminder set for ${timeInput.value}`;
    showSaved(message);
  }
}

enabledInput.addEventListener('change', saveSettings);
timeInput.addEventListener('change', saveSettings);

document.querySelector('#openQuest').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'open-quest' });
  window.close();
});

document.querySelector('#testReminder').addEventListener('click', async () => {
  notificationPreview.hidden = false;
  const response = await chrome.runtime.sendMessage({ type: 'test-reminder' });
  if (!response?.ok) {
    showSaved('Preview shown here · system notification failed');
    return;
  }
  if (response.shown) {
    showSaved('System notification sent · preview shown here');
  } else {
    permissionWarning.hidden = false;
    showSaved('Preview shown here · system notifications are blocked');
  }
});

refresh().catch(() => {
  statusTitle.textContent = 'Could not load the reminder';
  statusDetail.textContent = 'Close this window and try again.';
});
