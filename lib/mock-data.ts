import { addDays, getBrusselsDateKey } from "./dates";
import { CollectionResponse } from "./types";

const today = getBrusselsDateKey();
export const mockResponse: CollectionResponse = {
  address: { postalCode: "2800", street: "Voorbeeldstraat", houseNumber: "10" },
  collections: [
    { date: addDays(today, 1), wasteTypes: [{ code: "PMD", name: "PMD" }, { code: "HV", name: "Huisvuil" }] },
    { date: addDays(today, 4), wasteTypes: [{ code: "GFT", name: "GFT" }] },
    { date: addDays(today, 7), wasteTypes: [{ code: "PK", name: "Papier-karton" }] },
  ],
  lastUpdated: new Date().toISOString(), isMock: true,
};
