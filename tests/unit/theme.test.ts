import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCENTS,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
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
  assert.ok(ACCENTS.length >= 6);
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
