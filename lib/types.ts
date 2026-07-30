export interface Address { postalCode: string; street: string; houseNumber: string; }
export interface WasteType { code: string; name: string; sourceColor?: string; }
export interface CollectionDay { date: string; wasteTypes: WasteType[]; }
export interface CollectionResponse {
  address: Address; collections: CollectionDay[]; lastUpdated: string; isMock?: boolean;
}
export interface WasteCollectionProvider {
  getCollections(address: Address, startDate: string, endDate: string): Promise<CollectionResponse>;
}

/** The theme that is actually painted. */
export type Theme = "light" | "dark";
/** The stored preference; "system" follows the OS setting. */
export type ThemeMode = Theme | "system";
export type AccentId =
  | "green" | "teal" | "blue" | "indigo"
  | "purple" | "pink" | "orange" | "slate";
