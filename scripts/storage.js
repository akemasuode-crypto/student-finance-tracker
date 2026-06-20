const KEY = "financeTracker:data";
const SETTINGS_KEY = "financeTracker:settings";

export function loadRecords() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecords(records) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { cap: null, rates: { RWF: 1300, EUR: 0.92 }, displayCurrency: "USD" };
  } catch {
    return { cap: null, rates: { RWF: 1300, EUR: 0.92 }, displayCurrency: "USD" };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
