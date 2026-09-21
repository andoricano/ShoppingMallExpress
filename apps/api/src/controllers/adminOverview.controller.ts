import type {
    Request,
    Response,
} from "express";

import type {
    AdminDashboardInventoryAlert,
    AdminDashboardOverview,
} from "@mall/types";

import {
    supabaseAdmin,
} from "../config/supabase.js";

const KOREA_TIME_ZONE = "Asia/Seoul";
const LOW_STOCK_THRESHOLD = 5;

function getKoreaDayRange(
    now: Date,
) {
    const formatter = new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: KOREA_TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        },
    );

    const getDatePart = (
        type: Intl.DateTimeFormatPartTypes,
    ) => {
        const value = formatter
            .formatToParts(now)
            .find((part) => part.type === type)
            ?.value;

        if (!value) {
            throw new Error(
                `Korean date ${type} could not be determined.`,
            );
        }

        return Number(value);
    };

    const year = getDatePart("year");
    const month = getDatePart("month");
    const day = getDatePart("day");

    const start = new Date(
        Date.UTC(year, month - 1, day, -9),
    );

    return {
        start: start.toISOString(),
        end: new Date(
            start.getTime() + 24 * 60 * 60 * 1000,
        ).toISOString(),
    };
}

async function requireAdmin(
    req: Request,
    res: Response,
): Promise<boolean> {
    const authorization = req.header("authorization");
    const token = authorization?.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length).trim()
        : "";

    if (!token) {
        res.status(401).json({
            success: false,
            message: "관리자 인증이 필요합니다.",
        });

        return false;
    }

    const {
        data: authData,
        error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
        res.status(401).json({
            success: false,
            message: "유효하지 않은 인증 정보입니다.",
        });

        return false;
    }

    const {
        data: profile,
        error: profileError,
    } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

    if (profileError) {
        console.error(
            "[AdminOverview] 관리자 역할 조회 실패:",
            profileError,
        );

        res.status(500).json({
            success: false,
            message: "관리자 권한을 확인하지 못했습니다.",
        });

        return false;
    }

    if (profile?.role !== "ADMIN") {
        res.status(403).json({
            success: false,
            message: "관리자 권한이 필요합니다.",
        });

        return false;
    }

    return true;
}

export const getAdminOverview = async (
    req: Request,
    res: Response,
) => {
    try {
        if (!await requireAdmin(req, res)) {
            return;
        }

        const generatedAt = new Date();
        const today = getKoreaDayRange(generatedAt);

        const [
            pageConfigResult,
            pendingOrdersResult,
            todayOrdersResult,
            requestedRefundsResult,
            inventoryResult,
            productPostsResult,
            usersResult,
            todayUsersResult,
        ] = await Promise.all([
            supabaseAdmin
                .from("site_configs")
                .select("key", { count: "exact", head: true })
                .eq("key", "main_page"),
            supabaseAdmin
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("status", "PENDING"),
            supabaseAdmin
                .from("orders")
                .select("total_price")
                .gte("created_at", today.start)
                .lt("created_at", today.end),
            supabaseAdmin
                .from("refund_requests")
                .select("id", { count: "exact", head: true })
                .eq("status", "REQUESTED"),
            supabaseAdmin
                .from("inventory_items")
                .select("id, sku_code, current_stock"),
            supabaseAdmin
                .from("product_posts")
                .select("is_published"),
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true }),
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true })
                .gte("created_at", today.start)
                .lt("created_at", today.end),
        ]);

        const results = [
            pageConfigResult,
            pendingOrdersResult,
            todayOrdersResult,
            requestedRefundsResult,
            inventoryResult,
            productPostsResult,
            usersResult,
            todayUsersResult,
        ];

        const failedResult = results.find(
            (result) => result.error,
        );

        if (failedResult?.error) {
            throw failedResult.error;
        }

        const inventory = inventoryResult.data ?? [];
        const alerts: AdminDashboardInventoryAlert[] = inventory
            .filter((item) =>
                item.current_stock === 0 ||
                (
                    item.current_stock > 0 &&
                    item.current_stock <= LOW_STOCK_THRESHOLD
                ),
            )
            .map((item) => ({
                skuId: item.id,
                skuCode: item.sku_code,
                currentStock: item.current_stock,
            }));

        const todayOrders = todayOrdersResult.data ?? [];
        const productPosts = productPostsResult.data ?? [];

        const overview: AdminDashboardOverview = {
            generatedAt: generatedAt.toISOString(),
            pageConfig: {
                isConfigured: (pageConfigResult.count ?? 0) > 0,
            },
            orders: {
                pendingFulfillmentCount:
                    pendingOrdersResult.count ?? 0,
            },
            todayOrders: {
                count: todayOrders.length,
                totalAmount: todayOrders.reduce(
                    (total, order) =>
                        total + order.total_price,
                    0,
                ),
            },
            refunds: {
                requestedCount:
                    requestedRefundsResult.count ?? 0,
            },
            inventory: {
                lowStockThreshold:
                    LOW_STOCK_THRESHOLD,
                lowStockCount: inventory.filter(
                    (item) =>
                        item.current_stock > 0 &&
                        item.current_stock <= LOW_STOCK_THRESHOLD,
                ).length,
                outOfStockCount: inventory.filter(
                    (item) => item.current_stock === 0,
                ).length,
                alerts,
            },
            productPosts: {
                totalCount: productPosts.length,
                publishedCount: productPosts.filter(
                    (post) => post.is_published,
                ).length,
            },
            users: {
                totalCount: usersResult.count ?? 0,
                todayNewCount: todayUsersResult.count ?? 0,
            },
        };

        return res.json({
            success: true,
            data: overview,
        });
    } catch (error) {
        console.error(
            "[AdminOverview] overview 집계 실패:",
            error,
        );

        return res.status(500).json({
            success: false,
            message: "관리자 overview를 불러오지 못했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};
