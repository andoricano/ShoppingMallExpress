import { NextResponse } from "next/server";

import type {
    AdminRefundItem,
    AdminRefundRequest,
    AdminRefundRestockWare,
    RefundRequest,
} from "@mall/types";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type WareRow = {
    ware_code: string | null;
    name: string;
    warehouses: { name: string } | null;
};

type AllocationRow = {
    ware_id: string;
    quantity: number;
    wares: WareRow | null;
};

type RestockRow = {
    id: string;
    ware_id: string;
    quantity: number;
    created_at: string;
};

type RefundItemRow = {
    id: string;
    refund_request_id: string;
    order_item_id: string;
    quantity: number;
    refund_amount: number;
    created_at: string;
    order_items: {
        product_name_snapshot: string;
        variant_label_snapshot: string | null;
        order_item_ware_allocations: AllocationRow[] | null;
    } | null;
    refund_item_restocks: RestockRow[] | null;
};

type RefundRequestRow = {
    id: string;
    order_id: string;
    client_id: string;
    status: RefundRequest["status"];
    reason: string | null;
    requested_amount: number;
    requested_at: string;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
    refund_items: RefundItemRow[] | null;
};

type OrderItemRestockRow = {
    ware_id: string;
    quantity: number;
    refund_items: { order_item_id: string };
};

const sum = (rows: { quantity: number }[]) =>
    rows.reduce((total, row) => total + row.quantity, 0);

function toRefundItem(
    row: RefundItemRow,
    approved: boolean,
    restockedByOrderItemWare: Map<string, number>,
): AdminRefundItem {
    const restocks = (row.refund_item_restocks ?? []).map((restock) => ({
        id: restock.id,
        wareId: restock.ware_id,
        quantity: restock.quantity,
        createdAt: restock.created_at,
    }));
    const restockedQuantity = sum(restocks);

    // Only the OrderItem's original allocation Wares, and only when a restock
    // can actually be performed.
    const wares: AdminRefundRestockWare[] = approved
        ? (row.order_items?.order_item_ware_allocations ?? []).map((allocation) => {
            const restocked = restockedByOrderItemWare.get(
                `${row.order_item_id}:${allocation.ware_id}`,
            ) ?? 0;

            return {
                wareId: allocation.ware_id,
                wareCode: allocation.wares?.ware_code ?? null,
                wareName: allocation.wares?.name ?? allocation.ware_id,
                warehouseName: allocation.wares?.warehouses?.name ?? null,
                allocatedQuantity: allocation.quantity,
                restockedQuantity: restocked,
                remainingQuantity: Math.max(allocation.quantity - restocked, 0),
            };
        })
        : [];

    return {
        id: row.id,
        refundRequestId: row.refund_request_id,
        orderItemId: row.order_item_id,
        quantity: row.quantity,
        refundAmount: row.refund_amount,
        createdAt: row.created_at,
        productName: row.order_items?.product_name_snapshot ?? "",
        variantLabel: row.order_items?.variant_label_snapshot ?? null,
        restockedQuantity,
        restockableQuantity: approved
            ? Math.max(row.quantity - restockedQuantity, 0)
            : 0,
        restocks,
        wares,
    };
}

function toRefundRequest(
    row: RefundRequestRow,
    restockedByOrderItemWare: Map<string, number>,
): AdminRefundRequest {
    const approved = row.status === "APPROVED";

    return {
        id: row.id,
        orderId: row.order_id,
        clientId: row.client_id,
        status: row.status,
        reason: row.reason,
        requestedAmount: row.requested_amount,
        requestedAt: row.requested_at,
        processedAt: row.processed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: (row.refund_items ?? []).map((item) =>
            toRefundItem(item, approved, restockedByOrderItemWare),
        ),
    };
}

/**
 * This route intentionally exposes only the internal Admin refund read model,
 * including Ware/restock data (never a Consumer contract). Status mutation
 * and restock are isolated in the dynamic routes and delegate to the
 * service-role-only admin_transition_refund_status() and
 * admin_restock_refund_item() RPCs.
 */
export async function GET() {
    try {
        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase
            .from("refund_requests")
            .select(
                "*, refund_items(*, "
                + "order_items(product_name_snapshot, variant_label_snapshot, "
                + "order_item_ware_allocations(ware_id, quantity, wares(ware_code, name, warehouses(name)))), "
                + "refund_item_restocks(id, ware_id, quantity, created_at))",
            )
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        const rows = data as unknown as RefundRequestRow[];

        // The per-Ware limit spans every refund item of the same OrderItem.
        const orderItemIds = [
            ...new Set(
                rows
                    .filter((row) => row.status === "APPROVED")
                    .flatMap((row) => row.refund_items ?? [])
                    .map((item) => item.order_item_id),
            ),
        ];
        const restockedByOrderItemWare = new Map<string, number>();

        if (orderItemIds.length > 0) {
            const { data: restocks, error: restockError } = await supabase
                .from("refund_item_restocks")
                .select("ware_id, quantity, refund_items!inner(order_item_id)")
                .in("refund_items.order_item_id", orderItemIds);

            if (restockError) {
                throw restockError;
            }

            for (const restock of restocks as unknown as OrderItemRestockRow[]) {
                const key = `${restock.refund_items.order_item_id}:${restock.ware_id}`;

                restockedByOrderItemWare.set(
                    key,
                    (restockedByOrderItemWare.get(key) ?? 0) + restock.quantity,
                );
            }
        }

        return NextResponse.json({
            data: rows.map((row) => toRefundRequest(row, restockedByOrderItemWare)),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
