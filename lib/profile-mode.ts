export type ActiveProfile = "manager" | "resident";

export const ACTIVE_PROFILE_KEY = "amigo_active_profile";

export function readActiveProfile(): ActiveProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return value === "manager" || value === "resident" ? value : null;
  } catch {
    return null;
  }
}

export function saveActiveProfile(profile: ActiveProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profile);
  } catch {
    // localStorage indisponível
  }
}

export function clearActiveProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  } catch {
    // localStorage indisponível
  }
}
