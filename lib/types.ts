export interface Address { postalCode: string; street: string; houseNumber: string; }
export interface WasteType { code: string; name: string; sourceColor?: string; }
export interface CollectionDay { date: string; wasteTypes: WasteType[]; }
export interface CollectionResponse {
  address: Address; collections: CollectionDay[]; lastUpdated: string; isMock?: boolean;
}
export interface WasteCollectionProvider {
  getCollections(address: Address, startDate: string, endDate: string): Promise<CollectionResponse>;
}
