import { AccentId, ThemeMode } from "../lib/types";
import { ACCENT_KEY, THEME_MODE_KEY, isAccentId, isThemeMode } from "../lib/theme";

export interface ThemeSettingsService {
  getMode(): ThemeMode | null;
  saveMode(mode: ThemeMode): void;
  getAccent(): AccentId | null;
  saveAccent(accent: AccentId): void;
  /** Notifies on our own writes and on writes made by another tab. */
  subscribe(listener: () => void): () => void;
}

const listeners = new Set<() => void>();
/** Holds the choice when localStorage refuses the write (full, or private mode). */
const fallback = new Map<string, unknown>();

function read(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) return JSON.parse(stored);
  } catch {
    // Unreadable storage is treated as empty.
  }
  return fallback.has(key) ? fallback.get(key) : null;
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    fallback.delete(key);
  } catch {
    // The choice still applies to this session, it just will not be remembered.
    fallback.set(key, value);
  }
  for (const listener of listeners) listener();
}

export const themeSettingsService: ThemeSettingsService = {
  getMode() {
    const value = read(THEME_MODE_KEY);
    return isThemeMode(value) ? value : null;
  },
  saveMode(mode) {
    write(THEME_MODE_KEY, mode);
  },
  getAccent() {
    const value = read(ACCENT_KEY);
    return isAccentId(value) ? value : null;
  },
  saveAccent(accent) {
    write(ACCENT_KEY, accent);
  },
  subscribe(listener) {
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },
};
