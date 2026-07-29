import test from "node:test";
import assert from "node:assert/strict";
import { getWastePresentation, normalizeWasteType } from "../../lib/waste-normalization";
test("gekende IVAREM-categorieën krijgen een nuttige voorstelling", () => {
  const waste = normalizeWasteType({ fractieCode: "PK", fractie: "Papier-karton", kleurcode: "#FEC91B" });
  assert.equal(getWastePresentation(waste).key, "paper");
  assert.equal(waste.sourceColor, "#FEC91B");
});
test("onbekende categorieën behouden de bronbenaming", () => {
  const waste = normalizeWasteType({ fractieCode: "NEW", fractie: "Nieuwe fractie" });
  assert.equal(waste.name, "Nieuwe fractie");
  assert.equal(getWastePresentation(waste).key, "other");
  assert.equal(getWastePresentation(waste).icon, "category");
});
