// Values are CSS custom properties (see index.css :root / [data-theme='soft'])
// so the active theme can be swapped at runtime without touching call sites.
export const C = {
  cream: 'var(--cream)', // primary background
  paper: 'var(--paper)', // cards, elevated surfaces
  ink: 'var(--ink)', // primary text
  slate: 'var(--slate)', // secondary text, labels
  line: 'var(--line)', // borders, dividers
  sage: 'var(--sage)', // primary accent (muted green)
  sageDeep: 'var(--sage-deep)', // active / emphasis
  clay: 'var(--clay)', // warm secondary accent (sparingly)
  // semantic
  good: 'var(--good)',
  warn: 'var(--warn)',
  over: 'var(--over)', // overspend — muted, never harsh
};

export const F = {
  serif: "'Fraunces', serif", // display, headlines, key numbers
  sans: "'DM Sans', sans-serif", // body, UI
};

export const SHADOW = '0 1px 2px rgba(43, 42, 38, 0.04), 0 4px 16px rgba(43, 42, 38, 0.06)';
