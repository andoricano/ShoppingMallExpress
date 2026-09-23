import { NextResponse } from "next/server";

import type { Order, OrderItem } from "@mall/types";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type OrderItemRow = {
    id: string;
    order_id: string;
    product_id: string;
    product_variant_id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    product_name_snapshot: string;
    variant_label_snapshot: string | null;
    option_snapshot: Record<string, unknown>;
    image_url_snapshot: string | null;
    created_at: string;
};

type OrderRow = {
    id: string;
    client_id: string;
    order_number: string | null;
    status: Order["status"];
    shipping_address: Record<string, unknown> | null;
    subtotal: number;
    discount_amount: number;
    shipping_amount: number;
    total_amount: number;
    payment_reference: string | null;
    ordered_at: string;
    created_at: string;
    updated_at: string;
    order_items: OrderItemRow[] | null;
};

function toOrderItem(row: OrderItemRow): OrderItem {
    return {
        id: row.id,
        orderId: row.order_id,
        productId: row.product_id,
        productVariantId: row.product_variant_id,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        lineTotal: row.line_total,
        productNameSnapshot: row.product_name_snapshot,
        variantLabelSnapshot: row.variant_label_snapshot,
        optionSnapshot: row.option_snapshot,
        imageUrlSnapshot: row.image_url_snapshot,
        createdAt: row.created_at,
    };
}

export function toOrder(row: OrderRow): Order {
    return {
        id: row.id,
        clientId: row.client_id,
        orderNumber: row.order_number,
        status: row.status,
        shippingAddress: row.shipping_address,
        subtotal: row.subtotal,
        discountAmount: row.discount_amount,
        shippingAmount: row.shipping_amount,
        totalAmount: row.total_amount,
        paymentReference: row.payment_reference,
        orderedAt: row.ordered_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: (row.order_items ?? []).map(toOrderItem),
    };
}

export async function GET() {
    try {
        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .order("ordered_at", { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: (data as OrderRow[]).map(toOrder),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
