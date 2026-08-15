import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_APPEARANCE_SETTINGS,
  normalizeAppearanceSettings,
} from "../../services/appearance-settings";

test("geldige weergavevoorkeuren blijven behouden", () => {
  assert.deepEqual(normalizeAppearanceSettings({
    themeMode: "dark",
    colorScheme: "ocean",
  }), {
    themeMode: "dark",
    colorScheme: "ocean",
  });
});

test("ongeldige of ontbrekende voorkeuren vallen terug op veilige standaardwaarden", () => {
  assert.deepEqual(normalizeAppearanceSettings(null), DEFAULT_APPEARANCE_SETTINGS);
  assert.deepEqual(normalizeAppearanceSettings({
    themeMode: "automatic",
    colorScheme: "neon",
  }), DEFAULT_APPEARANCE_SETTINGS);
});
