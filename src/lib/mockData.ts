import type { Product } from "@/types";

/** No seed products — use your own via Admin or API. */
export const MOCK_PRODUCTS: Product[] = [];

/** No seed collection–product mapping — collections come from API/DB. */
export const COLLECTION_PRODUCT_IDS: Record<string, string[]> = {};

/** Collection list item shape for UI (id, name, slug, etc.). No seed data — use API. */
export interface MockCollectionItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
}

/** No seed collections — use your own via Admin or API. */
export const MOCK_COLLECTIONS: MockCollectionItem[] = [];
