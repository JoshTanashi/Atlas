const WELCOME_LAST_SHOWN_KEY = 'atlas-welcome-last-shown';
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours — long enough that refreshing or re-navigating doesn't replay it

export function shouldShowWelcome() {
  const last = Number(localStorage.getItem(WELCOME_LAST_SHOWN_KEY) || 0);
  return Date.now() - last > COOLDOWN_MS;
}

export function markWelcomeShown() {
  localStorage.setItem(WELCOME_LAST_SHOWN_KEY, String(Date.now()));
}
