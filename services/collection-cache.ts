import { Address, CollectionResponse } from "../lib/types";
const KEY = "afvalmorgen.collections.v1";
export const COLLECTION_CACHE_HOURS = 6;
interface CacheEntry { addressKey: string; savedAt: number; data: CollectionResponse; }
function addressKey(address: Address) {
  return `${address.postalCode}|${address.street}|${address.houseNumber}`.toLocaleLowerCase("nl-BE");
}
export const cacheService = {
  get(address: Address): { data: CollectionResponse; expired: boolean } | null {
    if (typeof window === "undefined") return null;
    try {
      const entry = JSON.parse(localStorage.getItem(KEY) || "null") as CacheEntry | null;
      if (!entry || entry.addressKey !== addressKey(address)) return null;
      return { data: entry.data, expired: Date.now() - entry.savedAt > COLLECTION_CACHE_HOURS * 3600000 };
    } catch { return null; }
  },
  save(address: Address, data: CollectionResponse) {
    localStorage.setItem(KEY, JSON.stringify({ addressKey: addressKey(address), savedAt: Date.now(), data }));
  },
  clear() { localStorage.removeItem(KEY); },
};
