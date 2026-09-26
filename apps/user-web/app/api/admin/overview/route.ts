import { NextResponse } from "next/server";

import type {
    AdminDashboardInventoryAlert,
    AdminDashboardOverview,
} from "@mall/types";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

const KOREA_TIME_ZONE = "Asia/Seoul";
const LOW_STOCK_THRESHOLD = 5;

// Orders paid but not yet shipped under the v2 lifecycle
// PENDING → PAID → PROCESSING → SHIPPED → DELIVERED.
// v3 has no PAID: a PENDING Order is already paid and waiting to be processed.
const PENDING_FULFILLMENT_STATUSES = process.env.NEXT_PUBLIC_MALL_V3 === "true"
    ? ["PENDING", "PROCESSING"]
    : ["PAID", "PROCESSING"];

type WareRow = {
    id: string;
    ware_code: string | null;
    name: string;
    current_stock: number;
    reserved_stock: number;
};

function getKoreaDayRange(now: Date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: KOREA_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((part) => part.type === type)?.value);

    const start = new Date(
        Date.UTC(getPart("year"), getPart("month") - 1, getPart("day"), -9),
    );

    return {
        start: start.toISOString(),
        end: new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
}

export async function GET() {
    try {
        const supabase = await requireAdminServiceClient();
        const generatedAt = new Date();
        const today = getKoreaDayRange(generatedAt);

        const [
            pendingOrdersResult,
            todayOrdersResult,
            requestedRefundsResult,
            waresResult,
            productPostsResult,
            publishedPostsResult,
            usersResult,
            todayUsersResult,
        ] = await Promise.all([
            supabase
                .from("orders")
                .select("id", { count: "exact", head: true })
                .in("status", PENDING_FULFILLMENT_STATUSES),
            supabase
                .from("orders")
                .select("total_amount")
                .neq("status", "CANCELLED")
                .gte("ordered_at", today.start)
                .lt("ordered_at", today.end),
            supabase
                .from("refund_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "REQUESTED"),
            supabase
                .from("wares")
                .select("id, ware_code, name, current_stock, reserved_stock")
                .eq("is_active", true),
            supabase
                .from("product_posts")
                .select("id", { count: "exact", head: true }),
            supabase
                .from("product_posts")
                .select("id", { count: "exact", head: true })
                .eq("status", "PUBLISHED"),
            supabase
                .from("user_profiles")
                .select("id", { count: "exact", head: true }),
            supabase
                .from("user_profiles")
                .select("id", { count: "exact", head: true })
                .gte("created_at", today.start)
                .lt("created_at", today.end),
        ]);

        const failed = [
            pendingOrdersResult,
            todayOrdersResult,
            requestedRefundsResult,
            waresResult,
            productPostsResult,
            publishedPostsResult,
            usersResult,
            todayUsersResult,
        ].find((result) => result.error);

        if (failed?.error) {
            throw failed.error;
        }

        const alerts: AdminDashboardInventoryAlert[] = (
            (waresResult.data ?? []) as WareRow[]
        )
            .map((ware) => ({
                wareId: ware.id,
                wareCode: ware.ware_code,
                name: ware.name,
                availableStock: Math.max(
                    Number(ware.current_stock) - Number(ware.reserved_stock),
                    0,
                ),
            }))
            .filter((alert) => alert.availableStock <= LOW_STOCK_THRESHOLD)
            .sort((a, b) => a.availableStock - b.availableStock);

        const todayOrders = (todayOrdersResult.data ?? []) as {
            total_amount: number | string;
        }[];

        const overview: AdminDashboardOverview = {
            generatedAt: generatedAt.toISOString(),
            orders: {
                pendingFulfillmentCount: pendingOrdersResult.count ?? 0,
            },
            todayOrders: {
                count: todayOrders.length,
                totalAmount: todayOrders.reduce(
                    (total, order) => total + Number(order.total_amount),
                    0,
                ),
            },
            refunds: {
                requestedCount: requestedRefundsResult.count ?? 0,
            },
            inventory: {
                lowStockThreshold: LOW_STOCK_THRESHOLD,
                lowStockCount: alerts.filter(
                    (alert) => alert.availableStock > 0,
                ).length,
                outOfStockCount: alerts.filter(
                    (alert) => alert.availableStock === 0,
                ).length,
                alerts,
            },
            productPosts: {
                totalCount: productPostsResult.count ?? 0,
                publishedCount: publishedPostsResult.count ?? 0,
            },
            users: {
                totalCount: usersResult.count ?? 0,
                todayNewCount: todayUsersResult.count ?? 0,
            },
        };

        return NextResponse.json({ data: overview });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
