import type { AuthUser, UserRole } from "../types";

const STORAGE_KEY = "stuntguard_user";

export function getCurrentUser(): AuthUser | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveCurrentUser(user: AuthUser) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasRole(role: UserRole) {
  return getCurrentUser()?.role === role;
}
