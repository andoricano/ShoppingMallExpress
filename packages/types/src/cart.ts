// @/types/cart.ts

import type { Product } from "./product.js";


/**
 * 장바구니 상품
 */
export interface CartItem {
    product: Product;
    quantity: number;
}

/**
 * 장바구니
 */
export interface Cart {
    items: CartItem[];
}