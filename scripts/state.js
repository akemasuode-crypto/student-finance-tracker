import { loadRecords, saveRecords } from "./storage.js";

let records = loadRecords();

export function getRecords() {
  return records;
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
