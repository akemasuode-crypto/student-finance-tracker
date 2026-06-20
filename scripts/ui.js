import { validateDescription, validateAmount, validateDate, validateCategory, hasDuplicateWord } from "./validators.js";

const form = document.getElementById("transaction-form");
const statusBox = document.getElementById("stats");

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
    statusBox.setAttribute("aria-live", "assertive");
    statusBox.textContent = "Please fix the errors in the form.";
    return;
  }

  statusBox.setAttribute("aria-live", "polite");
  statusBox.textContent = "Transaction saved.";
  form.reset();
});
