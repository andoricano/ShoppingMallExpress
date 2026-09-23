import type { ProductPostSummary } from "./productPost.js";

/** Wishlist is ProductPost-based, not ProductVariant- or Ware-based. */
export interface Wishlist {
    id: string;
    clientId: string;
    productPostId: string;
    createdAt: string;
}

export interface WishlistEntry extends Wishlist {
    productPost: ProductPostSummary;
}
