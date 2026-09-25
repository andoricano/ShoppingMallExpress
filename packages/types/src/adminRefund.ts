import type { RefundItem, RefundRequest } from "./refund.js";

/**
 * Admin-only Refund restock read model returned by `GET /api/admin/refunds`.
 * Ware/Warehouse and restock data are internal: these types must never be
 * used in Consumer contracts (`RefundRequest`/`RefundItem` stay Ware-free).
 */

/** One restock action of a refund item into an originally allocated Ware. */
export interface AdminRefundItemRestock {
    id: string;
    wareId: string;
    quantity: number;
    createdAt: string;
}

/**
 * A Ware that the refunded OrderItem was originally deducted from.
 * Only these Wares are valid restock targets.
 */
export interface AdminRefundRestockWare {
    wareId: string;
    wareCode: string | null;
    wareName: string;
    warehouseName: string | null;
    /** Quantity deducted from this Ware for the OrderItem. */
    allocatedQuantity: number;
    /** Restocked into this Ware across every refund item of the OrderItem. */
    restockedQuantity: number;
    /** `allocatedQuantity - restockedQuantity`. */
    remainingQuantity: number;
}

export interface AdminRefundItem extends RefundItem {
    productName: string;
    variantLabel: string | null;
    /** Sum of this refund item's restocks. */
    restockedQuantity: number;
    /** `quantity - restockedQuantity`; 0 unless the refund is `APPROVED`. */
    restockableQuantity: number;
    restocks: AdminRefundItemRestock[];
    /** Original allocation Wares; empty unless the refund is `APPROVED`. */
    wares: AdminRefundRestockWare[];
}

export interface AdminRefundRequest extends Omit<RefundRequest, "items"> {
    items: AdminRefundItem[];
}

/** Body of `POST /api/admin/refunds/[refundId]/restocks`. */
export interface AdminRestockRefundItemInput {
    refundItemId: string;
    wareId: string;
    quantity: number;
}
