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

/**
 * Admin-only input for the service-role `admin_create_product()` RPC.
 * Selling price belongs to ProductVariant. Ware is never part of this contract.
 */
export interface ProductOptionCreateInput {
    name: string;
    isRequired?: boolean;
    /** Ordered OptionValue labels; display order follows array order. */
    values: string[];
}

export interface ProductVariantCreateInput {
    price: number;
    skuCode?: string | null;
    label?: string | null;
    isActive?: boolean;
    meta?: JsonObject;
    /** Selected value per option, keyed by ProductOption name. */
    optionValues?: Record<string, string>;
}

export interface ProductCreateInput {
    name: string;
    description?: string | null;
    imageUrls?: string[];
    isActive?: boolean;
    meta?: JsonObject;
    options?: ProductOptionCreateInput[];
    /** At least one Variant is required. */
    variants: ProductVariantCreateInput[];
}

/** Result of `admin_create_product()`; variantIds follow input order. */
export interface ProductCreateResult {
    productId: string;
    variantIds: string[];
}

/**
 * Admin-only Product editing view. Includes inactive Options/Values/Variants.
 * Ware / Warehouse data is never part of this contract.
 */
export interface AdminProductOption extends ProductOption {
    values: ProductOptionValue[];
}

export interface AdminProductVariant extends ProductVariant {
    optionValueIds: string[];
}

export interface AdminProductDetail extends Product {
    options: AdminProductOption[];
    variants: AdminProductVariant[];
}

/**
 * Admin-only input for the service-role `admin_update_product()` RPC.
 * Only present keys change; ids must belong to the Product.
 * Values without id are appended to the Option.
 */
export interface ProductUpdateInput {
    product?: {
        name?: string;
        description?: string | null;
        isActive?: boolean;
    };
    options?: {
        id: string;
        name?: string;
        isRequired?: boolean;
        displayOrder?: number;
        values?: {
            id?: string;
            value?: string;
            displayOrder?: number;
            isActive?: boolean;
        }[];
    }[];
    variants?: {
        id: string;
        skuCode?: string | null;
        label?: string | null;
        price?: number;
        isActive?: boolean;
    }[];
}
