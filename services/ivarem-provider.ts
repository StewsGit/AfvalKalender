import { normalizeWasteType } from "../lib/waste-normalization";
import { Address, CollectionResponse, WasteCollectionProvider } from "../lib/types";

const BASE_URL = "https://diftar.ivarem.be";
interface Municipality { id: string; postcode: string; gemeente: string }
interface Street { id: string; straat: string }
interface IvaremCollection { ophaaldatum?: unknown; fractieCode?: unknown; fractie?: unknown; kleurcode?: unknown; }
function canonical(value: string) {
  return value.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("nl-BE");
}
async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...(init?.headers || {}) } });
  if (!response.ok) throw new Error(response.status >= 500
    ? "IVAREM is tijdelijk niet bereikbaar." : "IVAREM gaf een onverwacht antwoord.");
  if (!(response.headers.get("content-type") || "").includes("json")) throw new Error("IVAREM gaf een onverwacht antwoord.");
  return response.json() as Promise<T>;
}
export class IvaremWasteCollectionProvider implements WasteCollectionProvider {
  async getCollections(address: Address, startDate: string, endDate: string): Promise<CollectionResponse> {
    const municipalities = await requestJson<Municipality[]>(
      `${BASE_URL}/API/ophaalkalender/getGemeenten?q=${encodeURIComponent(address.postalCode)}`);
    const municipality = municipalities.find((item) => item.postcode === address.postalCode);
    if (!municipality) throw new Error("Deze postcode werd niet gevonden bij IVAREM.");

    const streets = await requestJson<Street[]>(
      `${BASE_URL}/API/ophaalkalender/GetStreetsByZipCodeId?query=${encodeURIComponent(address.street)}&zipcodeId=${encodeURIComponent(municipality.id)}`);
    const street = streets.find((item) => canonical(item.straat) === canonical(address.street));
    if (!street) throw new Error("Deze straat werd niet gevonden voor de gekozen postcode.");

    const source = await requestJson<IvaremCollection[]>(`${BASE_URL}/api/ophaalkalender/GetOphaaldata`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zipcodeId: municipality.id, streetId: street.id, housNr: address.houseNumber,
        straat: street.straat, gemeente: municipality.gemeente,
        fromDate: `${startDate}T00:00:00.000Z`, untilDate: `${endDate}T23:59:59.999Z`,
      }),
    });
    if (!Array.isArray(source)) throw new Error("IVAREM gaf een onverwacht antwoord.");
    const byDate = new Map<string, ReturnType<typeof normalizeWasteType>[]>();
    for (const item of source) {
      if (typeof item.ophaaldatum !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(item.ophaaldatum)) continue;
      const date = item.ophaaldatum.slice(0, 10);
      byDate.set(date, [...(byDate.get(date) || []), normalizeWasteType(item)]);
    }
    return {
      address,
      collections: [...byDate].sort(([a], [b]) => a.localeCompare(b))
        .map(([date, wasteTypes]) => ({ date, wasteTypes })),
      lastUpdated: new Date().toISOString(),
    };
  }
}
