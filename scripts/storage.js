const KEY = "financeTracker:data";

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
