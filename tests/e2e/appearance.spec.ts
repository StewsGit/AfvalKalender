import { test, expect, Page } from "@playwright/test";

/** Clicking the label is what a user does; the radio itself is visually hidden. */
const chooseMode = (page: Page, id: string) => page.locator(`label[for="theme-mode-${id}"]`).click();
const chooseAccent = (page: Page, id: string) => page.locator(`label[for="accent-${id}"]`).click();

const root = (page: Page) => page.locator("html");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // A first-time visitor has no address, so the settings screen is shown.
  await expect(page.getByRole("heading", { name: "Kies je thema en kleur" })).toBeVisible();
});

test("toont drie modi en de volledige accentpalet", async ({ page }) => {
  await expect(page.getByRole("radio", { name: "Licht" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Donker" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Systeem" })).toBeVisible();
  await expect(page.locator('input[name="accent"]')).toHaveCount(8);
});

test("donkere modus wordt toegepast en blijft bewaard na herladen", async ({ page }) => {
  await chooseMode(page, "dark");
  await expect(root(page)).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(root(page)).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Donker" })).toBeChecked();

  await chooseMode(page, "light");
  await expect(root(page)).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(root(page)).toHaveAttribute("data-theme", "light");
});

test("accentkleur wordt toegepast en blijft bewaard na herladen", async ({ page }) => {
  await expect(root(page)).toHaveAttribute("data-accent", "green");

  await chooseAccent(page, "blue");
  await expect(root(page)).toHaveAttribute("data-accent", "blue");

  await page.reload();
  await expect(root(page)).toHaveAttribute("data-accent", "blue");
  await expect(page.getByRole("radio", { name: "Oceaanblauw" })).toBeChecked();
});

test("de accentkleur verandert de zichtbare accentwaarde", async ({ page }) => {
  const eyebrow = page.locator(".eyebrow").first();
  const green = await eyebrow.evaluate((el) => getComputedStyle(el).color);

  await chooseAccent(page, "pink");
  await expect(root(page)).toHaveAttribute("data-accent", "pink");
  const pink = await eyebrow.evaluate((el) => getComputedStyle(el).color);

  expect(pink).not.toBe(green);
});

test("de systeemmodus volgt een wijziging van de OS-voorkeur zonder herladen", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await chooseMode(page, "system");
  await expect(root(page)).toHaveAttribute("data-theme", "light");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(root(page)).toHaveAttribute("data-theme", "dark");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(root(page)).toHaveAttribute("data-theme", "light");
});

test("de bewaarde voorkeur wordt vóór hydratatie toegepast en niet teruggezet", async ({ page }) => {
  await chooseMode(page, "dark");
  await chooseAccent(page, "purple");

  // Record every data-theme value from before the first page script runs, so a
  // flash back to the server default would show up in the log.
  await page.addInitScript(() => {
    const log: Array<string | null> = [];
    (window as unknown as { __themeLog: Array<string | null> }).__themeLog = log;
    const read = () => document.documentElement?.getAttribute("data-theme") ?? null;
    // Observe the document rather than <html>: the init script can run before
    // the parser has created documentElement.
    new MutationObserver(() => log.push(read()))
      .observe(document, { attributes: true, subtree: true, attributeFilter: ["data-theme"] });
    document.addEventListener("DOMContentLoaded", () => log.push(read()));
  });

  await page.reload();
  await expect(root(page)).toHaveAttribute("data-theme", "dark");
  await expect(root(page)).toHaveAttribute("data-accent", "purple");
  // Let hydration finish so a late overwrite would be caught.
  await expect(page.getByRole("radio", { name: "Donker" })).toBeChecked();

  const log = await page.evaluate(() => (window as unknown as { __themeLog: Array<string | null> }).__themeLog);
  const firstDark = log.indexOf("dark");
  expect(firstDark, `data-theme is nooit donker geworden: ${JSON.stringify(log)}`).toBeGreaterThanOrEqual(0);
  expect(log.slice(firstDark), `thema viel terug op licht: ${JSON.stringify(log)}`).not.toContain("light");
});

test("de instellingen blijven bruikbaar op een smal scherm", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('input[name="accent"]')).toHaveCount(8);
  for (const label of await page.locator(".accent-swatch").all()) {
    await expect(label).toBeVisible();
  }
  await chooseAccent(page, "orange");
  await expect(root(page)).toHaveAttribute("data-accent", "orange");
});

test("de pagina laadt zonder console- of netwerkfouten", async ({ page }) => {
  const problems: string[] = [];
  // The dev server serves the Geist webfonts from a path that 404s; that is a
  // pre-existing tooling issue, unrelated to the appearance settings.
  const knownDevServerNoise = /\.vinext[/\\]fonts[/\\]/;
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() !== "error") return;
    // Resource 404s are already covered by the requestfailed handler below.
    if (text.includes("Failed to load resource")) return;
    problems.push(`console: ${text}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    if (knownDevServerNoise.test(request.url())) return;
    problems.push(`request: ${request.url()}`);
  });

  await page.reload();
  await chooseMode(page, "dark");
  await chooseAccent(page, "indigo");
  await expect(root(page)).toHaveAttribute("data-accent", "indigo");

  expect(problems).toEqual([]);
});
