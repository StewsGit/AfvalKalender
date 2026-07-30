import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ACCENTS } from "../../lib/theme";

const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");

/** Reads a custom property's literal hex value out of globals.css. */
function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{3,8})\\s*;`, "i").exec(css);
  assert.ok(match, `--${name} ontbreekt in globals.css`);
  return match[1];
}

function channel(value: number): number {
  const ratio = value / 255;
  return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const full = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const [r, g, b] = [1, 3, 5].map((offset) => parseInt(full.slice(offset, offset + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/** WCAG AA for normal-sized text. The hero and buttons both carry body copy. */
const AA = 4.5;

test("de contrastberekening klopt op bekende waarden", () => {
  assert.equal(Math.round(contrast("#ffffff", "#000000")), 21);
  assert.equal(Math.round(contrast("#ffffff", "#ffffff")), 1);
});

test("hero-tekst blijft leesbaar op beide heroverlopen van elk accent", () => {
  const heroInk = token("hero-ink");
  for (const { id } of ACCENTS) {
    for (const suffix of ["h", "h2", "ho", "ho2"]) {
      const background = token(`c-${id}-${suffix}`);
      const ratio = contrast(background, heroInk);
      assert.ok(ratio >= AA, `--c-${id}-${suffix} (${background}) vs ${heroInk} is ${ratio.toFixed(2)}:1`);
    }
  }
});

test("tekst op een accentvlak blijft leesbaar in beide thema's", () => {
  // --on-accent is white in the light theme and near-black in the dark theme.
  const onAccentLight = "#ffffff";
  const onAccentDark = "#0e1614";
  for (const { id } of ACCENTS) {
    for (const suffix of ["", "-2"]) {
      const light = token(`c-${id}${suffix}`);
      const ratio = contrast(light, onAccentLight);
      assert.ok(ratio >= AA, `--c-${id}${suffix} (${light}) vs wit is ${ratio.toFixed(2)}:1`);
    }
    for (const suffix of ["-d", "-d2"]) {
      const dark = token(`c-${id}${suffix}`);
      const ratio = contrast(dark, onAccentDark);
      assert.ok(ratio >= AA, `--c-${id}${suffix} (${dark}) vs ${onAccentDark} is ${ratio.toFixed(2)}:1`);
    }
  }
});

test("elk accent heeft een eigen swatch-regel, anders valt het terug op groen", () => {
  for (const { id } of ACCENTS) {
    assert.match(css, new RegExp(`\\.accent-swatch\\[data-accent="${id}"\\]`),
      `swatch-regel voor ${id} ontbreekt`);
    assert.match(css, new RegExp(`:root\\[data-accent="${id}"\\]`),
      `accentregel voor ${id} ontbreekt`);
    assert.match(css, new RegExp(`:root\\[data-theme="dark"\\]\\[data-accent="${id}"\\]`),
      `donkere accentregel voor ${id} ontbreekt`);
  }
});
