import { validateDescription, validateAmount, validateDate, validateCategory, hasDuplicateWord } from "./validators.js";
import { getRecords, addRecord, updateRecord, deleteRecord } from "./state.js";
import { compileRegex, highlight, filterRecords } from "./search.js";

const form = document.getElementById("transaction-form");
const statusBox = document.getElementById("stats");
const tableBody = document.getElementById("records-body");
const searchInput = document.getElementById("search-input");
const caseToggle = document.getElementById("case-toggle");

let editingId = null;
let sortField = "date";
let sortDir = "desc";

function announce(message, urgent = false) {
  statusBox.setAttribute("aria-live", urgent ? "assertive" : "polite");
  statusBox.textContent = message;
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
    return;
  }

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

document.querySelectorAll("#records-table th[data-sort]").forEach(th => {
  th.style.cursor = "pointer";
  th.tabIndex = 0;
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

renderTable();
