import { Theme } from "../lib/types";

export interface ThemeSettingsService {
  getTheme(): Theme | null;
  saveTheme(theme: Theme): void;
  clearTheme(): void;
}

const THEME_KEY = "afvalmorgen.theme.v1";

export const themeSettingsService: ThemeSettingsService = {
  getTheme() {
    if (typeof window === "undefined") return null;
    try {
      const value = localStorage.getItem(THEME_KEY);
      return value ? (JSON.parse(value) as Theme) : null;
    } catch {
      // Invalid storage is treated as empty
      return null;
    }
  },
  saveTheme(theme) {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
  },
  clearTheme() {
    localStorage.removeItem(THEME_KEY);
  },
};