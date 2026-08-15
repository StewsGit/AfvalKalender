export type ThemeMode = "light" | "dark";
export type ColorScheme = "forest" | "ocean" | "berry" | "sunset";

export interface AppearanceSettings {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
}

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  themeMode: "light",
  colorScheme: "forest",
};

const KEY = "afvalmorgen.appearance.v1";
const THEME_MODES: ThemeMode[] = ["light", "dark"];
const COLOR_SCHEMES: ColorScheme[] = ["forest", "ocean", "berry", "sunset"];

export function normalizeAppearanceSettings(value: unknown): AppearanceSettings {
  if (!value || typeof value !== "object") return DEFAULT_APPEARANCE_SETTINGS;

  const stored = value as Partial<AppearanceSettings>;
  return {
    themeMode: THEME_MODES.includes(stored.themeMode as ThemeMode)
      ? stored.themeMode as ThemeMode
      : DEFAULT_APPEARANCE_SETTINGS.themeMode,
    colorScheme: COLOR_SCHEMES.includes(stored.colorScheme as ColorScheme)
      ? stored.colorScheme as ColorScheme
      : DEFAULT_APPEARANCE_SETTINGS.colorScheme,
  };
}

export const appearanceSettingsService = {
  get(): AppearanceSettings {
    if (typeof window === "undefined") return DEFAULT_APPEARANCE_SETTINGS;
    try {
      return normalizeAppearanceSettings(JSON.parse(localStorage.getItem(KEY) || "null"));
    } catch {
      return DEFAULT_APPEARANCE_SETTINGS;
    }
  },
  save(settings: AppearanceSettings) {
    localStorage.setItem(KEY, JSON.stringify(normalizeAppearanceSettings(settings)));
  },
  apply(settings: AppearanceSettings) {
    const normalized = normalizeAppearanceSettings(settings);
    document.documentElement.dataset.theme = normalized.themeMode;
    document.documentElement.dataset.colorScheme = normalized.colorScheme;
  },
};
