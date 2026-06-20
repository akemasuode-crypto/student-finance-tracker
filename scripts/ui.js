import { validateDescription, validateAmount, validateDate, validateCategory, hasDuplicateWord } from "./validators.js";
import { getRecords, setRecords, addRecord, updateRecord, deleteRecord, getCap, setCap, getRates, setRates, getDisplayCurrency, setDisplayCurrency } from "./state.js";
import { compileRegex, highlight, filterRecords } from "./search.js";
import { computeStats } from "./stats.js";

const form = document.getElementById("transaction-form");
const formStatus = document.getElementById("form-status");
const tableBody = document.getElementById("records-body");
const searchInput = document.getElementById("search-input");
const caseToggle = document.getElementById("case-toggle");
const settingsForm = document.getElementById("settings-form");
const capInput = document.getElementById("cap-input");
const rwfInput = document.getElementById("rwf-rate");
const eurInput = document.getElementById("eur-rate");
const currencySelect = document.getElementById("display-currency");
const exportBtn = document.getElementById("export-btn");
const importInput = document.getElementById("import-input");

let editingId = null;
let sortField = "date";
let sortDir = "desc";

const symbols = { USD: "$", RWF: "RWF ", EUR: "\u20ac" };

function formatCurrency(amountUSD) {
  const currency = getDisplayCurrency();
  const rates = getRates();
  const converted = currency === "USD" ? amountUSD : amountUSD * (rates[currency] || 1);
  const symbol = symbols[currency] || "";
  return symbol + converted.toFixed(2);
}

function announce(message, urgent = false) {
  formStatus.setAttribute("aria-live", urgent ? "assertive" : "polite");
  formStatus.textContent = message;
}

function sortRecords(records) {
  return [...records].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === "amount") {
      valA = Number(valA);
      valB = Number(valB);
    }
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

function renderDashboard() {
  const records = getRecords();
  const stats = computeStats(records);
  const cap = getCap();

  const statsBox = document.getElementById("stats");
  statsBox.innerHTML =
    "<div class=\"stat-card\"><p class=\"stat-label\">Total transactions</p><p class=\"stat-value\">" + stats.total + "</p></div>" +
    "<div class=\"stat-card\"><p class=\"stat-label\">Total spent</p><p class=\"stat-value\">" + formatCurrency(stats.sum) + "</p></div>" +
    "<div class=\"stat-card\"><p class=\"stat-label\">Top category</p><p class=\"stat-value\">" + stats.topCategory + "</p></div>";

  const trendBox = document.getElementById("trend-chart");
  const maxDay = Math.max.apply(null, stats.days.map(d => d.total).concat([1]));
  trendBox.innerHTML = stats.days.map(d => {
    const heightPct = (d.total / maxDay) * 100;
    return "<div class=\"trend-bar\" style=\"height:" + heightPct + "%\" title=\"" + d.date + ": " + formatCurrency(d.total) + "\"></div>";
  }).join("");

  const capBox = document.getElementById("cap-status");
  if (cap !== null && cap !== undefined && !isNaN(cap)) {
    const remaining = cap - stats.sum;
    if (remaining < 0) {
      capBox.setAttribute("aria-live", "assertive");
      capBox.textContent = "Over budget by " + formatCurrency(Math.abs(remaining)) + ".";
    } else {
      capBox.setAttribute("aria-live", "polite");
      capBox.textContent = formatCurrency(remaining) + " remaining under your cap.";
    }
  } else {
    capBox.textContent = "";
  }
}

function renderTable() {
  let records = getRecords();

  const pattern = searchInput.value.trim();
  const flags = caseToggle.checked ? "i" : "";
  const re = compileRegex(pattern, flags);

  if (pattern && !re) {
    announce("Invalid search pattern.", true);
  }

  records = filterRecords(records, re);
  records = sortRecords(records);

  tableBody.innerHTML = "";

  if (records.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = "<td colspan=\"5\">No transactions found.</td>";
    tableBody.appendChild(row);
  } else {
    records.forEach(r => {
      const row = document.createElement("tr");
      const desc = re ? highlight(r.description, re) : r.description;
      const cat = re ? highlight(r.category, re) : r.category;

      row.innerHTML =
        "<td>" + r.date + "</td>" +
        "<td>" + desc + "</td>" +
        "<td>" + cat + "</td>" +
        "<td>" + formatCurrency(Number(r.amount)) + "</td>" +
        "<td>" +
          "<button type=\"button\" class=\"edit-btn\" data-id=\"" + r.id + "\">Edit</button> " +
          "<button type=\"button\" class=\"delete-btn\" data-id=\"" + r.id + "\">Delete</button>" +
        "</td>";
      tableBody.appendChild(row);
    });
  }

  renderDashboard();
}

document.querySelectorAll("#records-table th[data-sort]").forEach(th => {
  th.addEventListener("click", () => applySort(th.dataset.sort));
  th.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      applySort(th.dataset.sort);
    }
  });
});

function applySort(field) {
  if (sortField === field) {
    sortDir = sortDir === "asc" ? "desc" : "asc";
  } else {
    sortField = field;
    sortDir = "asc";
  }
  renderTable();
}

searchInput.addEventListener("input", renderTable);
caseToggle.addEventListener("change", renderTable);

tableBody.addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("delete-btn")) {
    if (confirm("Delete this transaction?")) {
      deleteRecord(id);
      renderTable();
      announce("Transaction deleted.");
    }
  }

  if (e.target.classList.contains("edit-btn")) {
    const record = getRecords().find(r => r.id === id);
    if (!record) return;
    editingId = id;
    document.getElementById("description").value = record.description;
    document.getElementById("amount").value = record.amount;
    document.getElementById("category").value = record.category;
    document.getElementById("date").value = record.date;
    document.getElementById("description").focus();
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = document.getElementById("description").value.trim();
  const amount = document.getElementById("amount").value.trim();
  const category = document.getElementById("category").value.trim();
  const date = document.getElementById("date").value.trim();

  let valid = true;

  const descError = document.getElementById("description-error");
  if (!validateDescription(description)) {
    descError.textContent = "No leading/trailing spaces, and no double spaces.";
    valid = false;
  } else if (hasDuplicateWord(description)) {
    descError.textContent = "Looks like you repeated a word - check your description.";
    valid = false;
  } else {
    descError.textContent = "";
  }

  const amountError = document.getElementById("amount-error");
  if (!validateAmount(amount)) {
    amountError.textContent = "Enter a valid number, e.g. 12.50";
    valid = false;
  } else {
    amountError.textContent = "";
  }

  const dateError = document.getElementById("date-error");
  if (!validateDate(date)) {
    dateError.textContent = "Use format YYYY-MM-DD";
    valid = false;
  } else {
    dateError.textContent = "";
  }

  if (!validateCategory(category)) {
    valid = false;
  }

  if (!valid) {
    announce("Please fix the errors in the form.", true);
    return;
  }

  if (editingId) {
    updateRecord(editingId, { description, amount, category, date });
    announce("Transaction updated.");
    editingId = null;
  } else {
    addRecord({ description, amount, category, date });
    announce("Transaction saved.");
  }

  form.reset();
  renderTable();
});

const existingCap = getCap();
if (existingCap !== null && existingCap !== undefined) {
  capInput.value = existingCap;
}
const existingRates = getRates();
rwfInput.value = existingRates.RWF;
eurInput.value = existingRates.EUR;
currencySelect.value = getDisplayCurrency();

settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const capValue = parseFloat(capInput.value);
  if (!isNaN(capValue) && capValue >= 0) {
    setCap(capValue);
  }
  const rwf = parseFloat(rwfInput.value);
  const eur = parseFloat(eurInput.value);
  setRates({
    RWF: !isNaN(rwf) ? rwf : existingRates.RWF,
    EUR: !isNaN(eur) ? eur : existingRates.EUR
  });
  setDisplayCurrency(currencySelect.value);
  renderTable();
  announce("Settings updated.");
});

function isValidRecord(r) {
  return r && typeof r.id === "string" &&
    typeof r.description === "string" &&
    typeof r.amount === "number" &&
    typeof r.category === "string" &&
    typeof r.date === "string";
}

exportBtn.addEventListener("click", () => {
  const records = getRecords();
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "finance-tracker-export.json";
  a.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data) || !data.every(isValidRecord)) {
        announce("Import failed: invalid file structure.", true);
        return;
      }
      setRecords(data);
      renderTable();
      announce("Import successful: " + data.length + " records loaded.");
    } catch {
      announce("Import failed: not valid JSON.", true);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

renderTable();
