import type { ProductVariantStockStatus } from "./product.js";

/** Consumer Cart item returned by get_cart(). No Ware information is present. */
export interface CartItem {
    id: string;
    productId: string;
    productVariantId: string;
    productName: string;
    variantLabel: string | null;
    price: number;
    quantity: number;
    imageUrl: string | null;
    isAvailable: boolean;
    stockStatus: ProductVariantStockStatus;
}

export interface Cart {
    id: string;
    items: CartItem[];
}

/** Persisted Cart row. Ownership is derived from auth.uid() in consumer flows. */
export interface CartEntry {
    id: string;
    clientId: string;
    createdAt: string;
    updatedAt: string;
}

/** Persisted CartItem identity: Cart + Product + ProductVariant. */
export interface CartItemEntry {
    id: string;
    cartId: string;
    productId: string;
    productVariantId: string;
    quantity: number;
    createdAt: string;
    updatedAt: string;
}
