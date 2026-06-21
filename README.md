# Student Finance Tracker

A responsive, accessible vanilla HTML/CSS/JS web app for tracking student expenses.

## Theme
Student Finance Tracker

## Features
- Add, edit, and delete transactions with regex-validated form inputs
- Live regex search across description and category, with case-insensitive toggle and mark-tag highlighting
- Sortable table (date, description, amount) via clickable, keyboard-accessible column headers
- Dashboard with total transactions, total spent, top category, and a 7-day spending trend chart
- Monthly spending cap with ARIA live status (polite when under, assertive when exceeded)
- Currency settings: base currency USD plus manual conversion rates for RWF and EUR
- JSON import/export with structural validation before loading
- Auto-save to localStorage on every change
- Mobile-first responsive layout with breakpoints at ~768px and ~1024px
- Skip-to-content link, visible focus states, ARIA live regions throughout

## Regex Catalog
- Description (no leading/trailing spaces): ^\S(?:.*\S)?$
- Amount (up to 2 decimals, no leading zero): ^(0|[1-9]\d*)(\.\d{1,2})?$
- Date (YYYY-MM-DD): ^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$
- Category (letters, spaces, hyphens): ^[A-Za-z]+(?:[ -][A-Za-z]+)*$
- Advanced - duplicate word (back-reference): \b(\w+)\s+\1\b
- Search example - cents present: \.\d{2}\b
- Search example - beverage keyword: (coffee|tea)

## Keyboard Map
- Tab / Shift+Tab - move between links, inputs, buttons, and table headers
- Enter on the first link - skip to main content
- Enter or Space on a table header - sort by that column, toggles ascending/descending
- Enter - submit the active form

## Accessibility Notes
- Semantic landmarks: header, nav, main, section, footer
- All form inputs have bound label elements
- Visible focus outline on every interactive element
- Form errors announced via role="alert"; save/delete/import status announced via aria-live regions
- Spending cap status switches between aria-live="polite" (under cap) and "assertive" (over cap)
- Color palette checked for adequate contrast against light backgrounds

## Running Tests
Open tests/tests.html directly in a browser. It runs assertion checks against scripts/validators.js and prints PASS/FAIL results to the page.

## Live Demo
Add your GitHub Pages link here once enabled.

