export function compileRegex(input, flags = "i") {
  try {
    return input ? new RegExp(input, flags) : null;
  } catch {
    return null;
  }
}

export function highlight(text, re) {
  if (!re) return text;
  return text.replace(re, m => "<mark>" + m + "</mark>");
}

export function filterRecords(records, re) {
  if (!re) return records;
  return records.filter(r => re.test(r.description) || re.test(r.category));
}
