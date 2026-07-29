import { Address } from "../lib/types";
export interface AddressSettingsService {
  getAddress(): Address | null; saveAddress(address: Address): void; clearAddress(): void;
}
const KEY = "afvalmorgen.address.v1";
export const addressSettingsService: AddressSettingsService = {
  getAddress() {
    if (typeof window === "undefined") return null;
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "null");
      if (value?.postalCode && value?.street && value?.houseNumber) return value as Address;
    } catch { /* Invalid storage is treated as empty. */ }
    return null;
  },
  saveAddress(address) { localStorage.setItem(KEY, JSON.stringify(address)); },
  clearAddress() { localStorage.removeItem(KEY); },
};
