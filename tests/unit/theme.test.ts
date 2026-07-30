import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCENTS,
  ACCENT_KEY,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  THEME_MODES,
  THEME_MODE_KEY,
  isAccentId,
  isThemeMode,
  resolveTheme,
  themeBootstrapScript,
} from "../../lib/theme";

test("systeemvoorkeur bepaalt het thema zolang de gebruiker niets koos", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
});

test("een expliciete keuze negeert de systeemvoorkeur", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("ongeldige opgeslagen waarden worden niet als voorkeur aanvaard", () => {
  for (const value of [null, undefined, "", "donker", "GREEN", 1, {}]) {
    assert.equal(isThemeMode(value), false);
    assert.equal(isAccentId(value), false);
  }
});

test("de standaardwaarden horen bij het aanbod", () => {
  assert.equal(isThemeMode(DEFAULT_MODE), true);
  assert.equal(isAccentId(DEFAULT_ACCENT), true);
});

test("elk accent heeft een uniek id en een leesbaar label", () => {
  const ids = ACCENTS.map((accent) => accent.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ACCENTS.length, 8);
  for (const accent of ACCENTS) {
    assert.equal(isAccentId(accent.id), true);
    assert.ok(accent.label.length > 0);
  }
});

test("het bootstrap-script kent dezelfde sleutels en accenten als de service", () => {
  assert.match(themeBootstrapScript, /afvalmorgen\.theme\.v1/);
  assert.match(themeBootstrapScript, /afvalmorgen\.accent\.v1/);
  assert.match(themeBootstrapScript, /prefers-color-scheme: dark/);
  for (const accent of ACCENTS) {
    assert.ok(themeBootstrapScript.includes(`"${accent.id}"`), `${accent.id} ontbreekt in het script`);
  }
});

/**
 * The script must stay behaviourally identical to resolveTheme: it is a
 * hand-written copy that runs before React exists, so nothing else would catch
 * a divergence.
 */
function runBootstrap(stored: Record<string, string>, prefersDark: boolean) {
  const attributes: Record<string, string> = {};
  const documentStub = {
    documentElement: {
      setAttribute(name: string, value: string) { attributes[name] = value; },
    },
  };
  const localStorageStub = {
    getItem: (key: string) => (key in stored ? stored[key] : null),
  };
  const windowStub = { matchMedia: () => ({ matches: prefersDark }) };
  new Function("document", "localStorage", "window", themeBootstrapScript)(
    documentStub, localStorageStub, windowStub,
  );
  return attributes;
}

test("het bootstrap-script kiest hetzelfde thema als resolveTheme", () => {
  for (const mode of THEME_MODES) {
    for (const prefersDark of [true, false]) {
      const attributes = runBootstrap({ [THEME_MODE_KEY]: JSON.stringify(mode) }, prefersDark);
      assert.equal(attributes["data-theme"], resolveTheme(mode, prefersDark),
        `modus ${mode} met prefersDark=${prefersDark}`);
    }
  }
});

test("het bootstrap-script valt terug op de standaarden bij rommel in de opslag", () => {
  for (const junk of ['"donker"', "null", "{}", "not json at all", '"GREEN"']) {
    const attributes = runBootstrap({ [THEME_MODE_KEY]: junk, [ACCENT_KEY]: junk }, false);
    assert.equal(attributes["data-theme"], resolveTheme(DEFAULT_MODE, false));
    assert.equal(attributes["data-accent"], DEFAULT_ACCENT);
  }
});

test("het bootstrap-script past een geldig bewaard accent toe", () => {
  for (const accent of ACCENTS) {
    const attributes = runBootstrap({ [ACCENT_KEY]: JSON.stringify(accent.id) }, false);
    assert.equal(attributes["data-accent"], accent.id);
  }
});
