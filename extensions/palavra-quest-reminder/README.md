# Palavra Quest — Daily Portuguese

A small Manifest V3 Chrome extension that reminds the learner once per day to complete a three-minute Palavra Quest mission.

## What it does

- Lets the learner choose a daily reminder time.
- Fires within five seconds when the current minute is selected for testing.
- Opens a focused Chrome reminder window, with a system notification as a secondary alert.
- Opens the existing Palavra Quest website, so vocabulary progress remains in the website’s local storage.
- Receives today’s active-practice time from the website.
- Suppresses the reminder after three active minutes have been completed that day.
- Always shows an in-popup notification preview and reports when operating-system notifications are blocked.
- Uses only `alarms`, `notifications`, `storage`, and access to the Palavra Quest page.

## Test locally

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `palavra-quest-reminder` directory.
5. Open the extension popup and use **Preview notification**.

## Publish

Upload the versioned ZIP from the repository’s `downloads` directory to the Chrome Web Store developer dashboard. Increment `version` in `manifest.json` for every update, rebuild the ZIP, and submit the new package for review.
