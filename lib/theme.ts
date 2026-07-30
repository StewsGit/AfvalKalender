import { AccentId, Theme, ThemeMode } from "./types";

/** Storage keys follow the "afvalmorgen.<feature>.v1" convention. */
export const THEME_MODE_KEY = "afvalmorgen.theme.v1";
export const ACCENT_KEY = "afvalmorgen.accent.v1";

export const DEFAULT_MODE: ThemeMode = "system";
export const DEFAULT_ACCENT: AccentId = "green";

/** Also the order the modes are offered in. */
export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

/**
 * Accent identities. The colour values themselves live in globals.css as
 * `--c-<id>*` custom properties so the cascade can apply them before hydration;
 * here we only keep the id and its Dutch label.
 */
export const ACCENTS: Array<{ id: AccentId; label: string }> = [
  { id: "green", label: "Bosgroen" },
  { id: "teal", label: "Zeegroen" },
  { id: "blue", label: "Oceaanblauw" },
  { id: "indigo", label: "Indigo" },
  { id: "purple", label: "Pruim" },
  { id: "pink", label: "Framboos" },
  { id: "orange", label: "Amber" },
  { id: "slate", label: "Leisteen" },
];

const ACCENT_IDS = ACCENTS.map((accent) => accent.id);

export const THEME_MODE_LABELS: Record<ThemeMode, { label: string; icon: string }> = {
  light: { label: "Licht", icon: "light_mode" },
  dark: { label: "Donker", icon: "dark_mode" },
  system: { label: "Systeem", icon: "contrast" },
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && (THEME_MODES as string[]).includes(value);
}

export function isAccentId(value: unknown): value is AccentId {
  return typeof value === "string" && (ACCENT_IDS as string[]).includes(value);
}

/** Turns a stored preference into the theme that is actually painted. */
export function resolveTheme(mode: ThemeMode, prefersDark: boolean): Theme {
  if (mode === "system") return prefersDark ? "dark" : "light";
  return mode;
}

/**
 * Runs in <head> before first paint so the correct theme and accent are on the
 * <html> element from the very first frame. Kept in sync with the service by
 * sharing the same storage keys and accent ids.
 */
export const themeBootstrapScript = `(function(){try{
var d=document.documentElement;
function read(key,fallback,allowed){try{var v=JSON.parse(localStorage.getItem(key));return allowed.indexOf(v)<0?fallback:v;}catch(e){return fallback;}}
var mode=read(${JSON.stringify(THEME_MODE_KEY)},${JSON.stringify(DEFAULT_MODE)},${JSON.stringify(THEME_MODES)});
var accent=read(${JSON.stringify(ACCENT_KEY)},${JSON.stringify(DEFAULT_ACCENT)},${JSON.stringify(ACCENT_IDS)});
var dark=mode==="dark"||(mode==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
d.setAttribute("data-theme",dark?"dark":"light");
d.setAttribute("data-accent",accent);
}catch(e){}})();`;
