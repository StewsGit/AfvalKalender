import { Address } from "../../../lib/types";
import { IvaremWasteCollectionProvider } from "../../../services/ivarem-provider";
const provider = new IvaremWasteCollectionProvider();
function validAddress(value: unknown): value is Address {
  if (!value || typeof value !== "object") return false;
  const address = value as Record<string, unknown>;
  return typeof address.postalCode === "string" && /^\d{4}$/.test(address.postalCode)
    && typeof address.street === "string" && address.street.trim().length >= 2
    && typeof address.houseNumber === "string" && /^\d+[a-zA-Z]?$/.test(address.houseNumber);
}
export async function POST(request: Request) {
  try {
    const body = await request.json() as { address?: unknown; startDate?: unknown; endDate?: unknown };
    if (!validAddress(body.address)) return Response.json(
      { error: "Vul een geldige postcode, straat en huisnummer in." }, { status: 400 });
    if (typeof body.startDate !== "string" || typeof body.endDate !== "string") return Response.json(
      { error: "De gevraagde periode is ongeldig." }, { status: 400 });
    const result = await provider.getCollections(body.address, body.startDate, body.endDate);
    return Response.json(result, { headers: { "Cache-Control": "private, max-age=0", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "De kalender kon niet worden geladen.";
    return Response.json({ error: message }, { status: /niet gevonden|ongeldig|geldige/.test(message) ? 404 : 502 });
  }
}
