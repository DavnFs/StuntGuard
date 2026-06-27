import type { AuthUser, UserRole } from "../types";

const STORAGE_KEY = "stuntguard_user";

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<AuthUser>;
  return (
    typeof user.token === "string" &&
    typeof user.email === "string" &&
    typeof user.name === "string" &&
    (user.role === "parent" || user.role === "guest") &&
    typeof user.expires_at === "number" &&
    user.expires_at > Date.now() / 1000
  );
}

export function getCurrentUser(): AuthUser | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as unknown;
    if (isAuthUser(user)) return user;
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
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
