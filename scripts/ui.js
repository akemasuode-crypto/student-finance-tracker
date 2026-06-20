import { validateDescription, validateAmount, validateDate, validateCategory, hasDuplicateWord } from "./validators.js";
import { getRecords, addRecord, updateRecord, deleteRecord, getCap, setCap } from "./state.js";
import { compileRegex, highlight, filterRecords } from "./search.js";
import { computeStats } from "./stats.js";

const form = document.getElementById("transaction-form");
const formStatus = document.getElementById("form-status");
const tableBody = document.getElementById("records-body");
const searchInput = document.getElementById("search-input");
const caseToggle = document.getElementById("case-toggle");
const settingsForm = document.getElementById("settings-form");
const capInput = document.getElementById("cap-input");

let editingId = null;
let sortField = "date";
let sortDir = "desc";

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
    "<p>Total transactions: " + stats.total + "</p>" +
    "<p>Total spent: $" + stats.sum.toFixed(2) + "</p>" +
    "<p>Top category: " + stats.topCategory + "</p>";

  const trendBox = document.getElementById("trend-chart");
  const maxDay = Math.max.apply(null, stats.days.map(d => d.total).concat([1]));
  trendBox.innerHTML = stats.days.map(d => {
    const heightPct = (d.total / maxDay) * 100;
    return "<div class=\"trend-bar\" style=\"height:" + heightPct + "%\" title=\"" + d.date + ": $" + d.total.toFixed(2) + "\"></div>";
  }).join("");

  const capBox = document.getElementById("cap-status");
  if (cap !== null && cap !== undefined && !isNaN(cap)) {
    const remaining = cap - stats.sum;
    if (remaining < 0) {
      capBox.setAttribute("aria-live", "assertive");
      capBox.textContent = "Over budget by $" + Math.abs(remaining).toFixed(2) + ".";
    } else {
      capBox.setAttribute("aria-live", "polite");
      capBox.textContent = "$" + remaining.toFixed(2) + " remaining under your cap.";
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
        "<td>$" + Number(r.amount).toFixed(2) + "</td>" +
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
  th.style.cursor = "pointer";
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

settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = parseFloat(capInput.value);
  if (!isNaN(value) && value >= 0) {
    setCap(value);
    renderDashboard();
    announce("Spending cap updated.");
  }
});

renderTable();
