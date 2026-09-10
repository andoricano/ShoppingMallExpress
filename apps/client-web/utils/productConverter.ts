// apps/user-web/utils/product.ts

import { Product } from "@mall/types";
import type { ProductCardData } from "@mall/mall-page-viewer";

export function toProductCardData(
    product: Product,
): ProductCardData {
    return {
        id: product.id,
        imageUrl: product.mainImageUrl,
        title: product.name,
        summary: product.description,
        price: product.price,
    };
}

export function toProductCardDataList(
    products: Product[],
): ProductCardData[] {
    return products.map(
        toProductCardData,
    );
}