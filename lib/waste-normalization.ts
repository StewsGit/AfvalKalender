import { WasteType } from "./types";

export interface WastePresentation { key: string; label: string; icon: string; color: string; }
const categories: Array<{ matches: RegExp; value: Omit<WastePresentation, "label"> }> = [
  { matches: /\b(pmd|pmc|pmk)\b/i, value: { key: "pmd", icon: "recycling", color: "#2186c4" } },
  { matches: /\b(gft|groente|fruit|tuinafval)\b/i, value: { key: "gft", icon: "eco", color: "#178c06" } },
  { matches: /\b(papier|karton|pk)\b/i, value: { key: "paper", icon: "newspaper", color: "#b98700" } },
  { matches: /\b(huisvuil|restafval|hv)\b/i, value: { key: "residual", icon: "delete", color: "#383f3d" } },
  { matches: /\b(grof|grofvuil)\b/i, value: { key: "bulky", icon: "inventory_2", color: "#394a46" } },
  { matches: /\b(metaal)\b/i, value: { key: "metal", icon: "construction", color: "#607d8b" } },
  { matches: /\b(snoei|takken|hout)\b/i, value: { key: "garden", icon: "forest", color: "#4f7d38" } },
  { matches: /\b(glas)\b/i, value: { key: "glass", icon: "wine_bar", color: "#08766a" } },
];
export function getWastePresentation(waste: WasteType): WastePresentation {
  const category = categories.find((item) => item.matches.test(`${waste.code} ${waste.name}`));
  return {
    key: category?.value.key ?? "other", label: waste.name, icon: category?.value.icon ?? "category",
    color: category?.value.color || waste.sourceColor || "#6c7480",
  };
}
export function normalizeWasteType(source: { fractieCode?: unknown; fractie?: unknown; kleurcode?: unknown }): WasteType {
  const name = typeof source.fractie === "string" && source.fractie.trim() ? source.fractie.trim() : "Andere afvalsoort";
  const code = typeof source.fractieCode === "string" && source.fractieCode.trim() ? source.fractieCode.trim() : "OTHER";
  const sourceColor = typeof source.kleurcode === "string" && /^#[0-9a-f]{6}$/i.test(source.kleurcode)
    ? source.kleurcode : undefined;
  return { code, name, sourceColor };
}
