export type JsonObject = Record<string, unknown>;

/** Consumer-safe variant availability returned by Mall v2 RPCs. */
export type ProductVariantStockStatus =
    | "AVAILABLE"
    | "OUT_OF_STOCK"
    | "UNAVAILABLE";

/** Product common data. Selling price belongs to ProductVariant. */
export interface Product {
    id: string;
    name: string;
    description: string | null;
    imageUrls: string[];
    isActive: boolean;
    meta: JsonObject;
    createdAt: string;
    updatedAt: string;
}

export interface ProductOption {
    id: string;
    productId: string;
    name: string;
    displayOrder: number;
    isRequired: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductOptionValue {
    id: string;
    productOptionId: string;
    value: string;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/** The actual sellable unit. It never contains Ware information. */
export interface ProductVariant {
    id: string;
    productId: string;
    skuCode: string | null;
    label: string | null;
    price: number;
    isActive: boolean;
    meta: JsonObject;
    createdAt: string;
    updatedAt: string;
}

export interface ProductVariantAvailability {
    productVariantId: string;
    isAvailable: boolean;
    stockStatus: ProductVariantStockStatus;
}

/** Product-detail RPC variant payload. Consumer-safe by design. */
export interface ConsumerProductVariant
    extends ProductVariantAvailability {
    id: string;
    skuCode: string | null;
    label: string | null;
    price: number;
    meta: JsonObject;
    optionValueIds: string[];
}

export interface ConsumerProductOption {
    id: string;
    name: string;
    displayOrder: number;
    isRequired: boolean;
    values: Pick<
        ProductOptionValue,
        "id" | "value" | "displayOrder"
    >[];
}

/** Consumer-safe payload returned by get_product_detail(). */
export interface ProductDetail {
    id: string;
    name: string;
    description: string | null;
    imageUrls: string[];
    meta: JsonObject;
    options: ConsumerProductOption[];
    variants: ConsumerProductVariant[];
}
