import { loadRecords, saveRecords, loadSettings, saveSettings } from "./storage.js";

let records = loadRecords();
let settings = loadSettings();

export function getRecords() {
  return records;
}

export function setRecords(newRecords) {
  records = newRecords;
  saveRecords(records);
}

export function addRecord(record) {
  const now = new Date().toISOString();
  const newRecord = {
    id: "txn_" + Date.now(),
    ...record,
    amount: parseFloat(record.amount),
    createdAt: now,
    updatedAt: now
  };
  records.push(newRecord);
  saveRecords(records);
  return newRecord;
}

export function updateRecord(id, updates) {
  records = records.map(r =>
    r.id === id
      ? { ...r, ...updates, amount: parseFloat(updates.amount ?? r.amount), updatedAt: new Date().toISOString() }
      : r
  );
  saveRecords(records);
}

export function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveRecords(records);
}

export function getCap() {
  return settings.cap;
}

export function setCap(value) {
  settings.cap = value;
  saveSettings(settings);
}

export function getRates() {
  return settings.rates || { RWF: 1300, EUR: 0.92 };
}

export function setRates(rates) {
  settings.rates = rates;
  saveSettings(settings);
}

export function getDisplayCurrency() {
  return settings.displayCurrency || "USD";
}

export function setDisplayCurrency(code) {
  settings.displayCurrency = code;
  saveSettings(settings);
}
