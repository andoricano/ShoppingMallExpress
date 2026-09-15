// @/types/wishlist.ts

import type { Product } from "./product.js";


export interface Wishlist {
    id: string;
    clientId: string;
    productId: string;
    createdAt: string;
}

export interface WishlistItem {
    id: string;
    clientId: string;
    productId: string;
    createdAt: string;

    product: Pick<
        Product,
        | "id"
        | "name"
        | "mainImageUrl"
        | "price"
    >;
}