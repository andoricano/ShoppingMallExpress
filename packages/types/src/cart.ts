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

/** API 장바구니 조회/생성에서 반환하는 저장 행 */
export interface CartEntry {
    id: string;
    clientId: string;
    productId: string;
    quantity: number;
    createdAt: string;
    updatedAt: string;
    product?: Product;
}
