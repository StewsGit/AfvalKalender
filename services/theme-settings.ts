import { AccentId, ThemeMode } from "../lib/types";
import { ACCENT_KEY, THEME_MODE_KEY, isAccentId, isThemeMode } from "../lib/theme";

export interface ThemeSettingsService {
  getMode(): ThemeMode | null;
  saveMode(mode: ThemeMode): void;
  getAccent(): AccentId | null;
  saveAccent(accent: AccentId): void;
  clear(): void;
  /** Notifies on our own writes and on writes made by another tab. */
  subscribe(listener: () => void): () => void;
}

function read(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    // Invalid storage is treated as empty.
    return null;
  }
}

const listeners = new Set<() => void>();

function write(key: string, value: string) {
  localStorage.setItem(key, JSON.stringify(value));
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
  clear() {
    localStorage.removeItem(THEME_MODE_KEY);
    localStorage.removeItem(ACCENT_KEY);
    for (const listener of listeners) listener();
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
