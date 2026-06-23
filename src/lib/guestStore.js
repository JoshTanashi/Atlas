const GUEST_MODE_KEY = 'atlas-guest-mode';
const GUEST_PROFILE_KEY = 'atlas-guest-profile';

const DEFAULT_GUEST_PROFILE = {
  display_name: null,
  is_pro: false,
  pro_plan: null,
  pro_current_period_end: null,
  onboarding_completed_at: null,
};

export function isGuestModeFlagSet() {
  return localStorage.getItem(GUEST_MODE_KEY) === 'true';
}

export function setGuestModeFlag() {
  localStorage.setItem(GUEST_MODE_KEY, 'true');
}

export function clearGuestModeFlag() {
  localStorage.removeItem(GUEST_MODE_KEY);
}

export function loadGuestProfile() {
  try {
    const raw = localStorage.getItem(GUEST_PROFILE_KEY);
    return raw ? { ...DEFAULT_GUEST_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_GUEST_PROFILE };
  } catch {
    return { ...DEFAULT_GUEST_PROFILE };
  }
}

export function saveGuestProfile(profile) {
  localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearGuestProfile() {
  localStorage.removeItem(GUEST_PROFILE_KEY);
}
