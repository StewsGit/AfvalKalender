import test from "node:test";
import assert from "node:assert/strict";
import { addDays, getBrusselsDateKey, getNextDateKeys } from "../../lib/dates";
test("Brusselse tijd gebruikt de lokale dag rond UTC-middernacht", () => {
  assert.equal(getBrusselsDateKey(new Date("2026-07-27T22:30:00Z")), "2026-07-28");
});
test("komende datums beginnen morgen en gaan over maandgrenzen", () => {
  assert.deepEqual(getNextDateKeys(3, new Date("2026-07-30T10:00:00Z")),
    ["2026-07-31", "2026-08-01", "2026-08-02"]);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});
