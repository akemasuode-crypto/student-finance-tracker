export function validateDescription(value) {
  const re = /^\S(?:.*\S)?$/;
  return re.test(value);
}

export function validateAmount(value) {
  const re = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
  return re.test(value);
}

export function validateDate(value) {
  const re = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  return re.test(value);
}

export function validateCategory(value) {
  const re = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
  return re.test(value);
}

// Advanced regex: back-reference — catches accidental repeated words
// e.g. "Lunch Lunch at cafeteria"
export function hasDuplicateWord(value) {
  const re = /\b(\w+)\s+\1\b/i;
  return re.test(value);
}
