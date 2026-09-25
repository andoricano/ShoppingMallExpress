/**
 * Admin-only ProductVariant <-> Ware link models used by
 * `/api/admin/products/[productId]/variant-wares`. Ware/Warehouse data is
 * internal: these types must never be used in Consumer contracts
 * (`ProductVariant`/`ConsumerProductVariant` stay Ware-free).
 */

/** A Ware currently linked to a ProductVariant. */
export interface AdminVariantLinkedWare {
    wareId: string;
    wareCode: string | null;
    wareName: string;
    warehouseName: string | null;
    currentStock: number;
    reservedStock: number;
    isActive: boolean;
}

export interface AdminProductVariantWares {
    productVariantId: string;
    wares: AdminVariantLinkedWare[];
}

/** Body of `POST /api/admin/products/[productId]/variant-wares`. */
export interface AdminLinkVariantWareInput {
    productVariantId: string;
    wareId: string;
}

export interface AdminLinkVariantWareResult {
    relationId: string;
    /** `true` when the Variant was already linked to the Ware (no change). */
    alreadyLinked: boolean;
}
