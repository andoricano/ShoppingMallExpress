/**
 * Admin-only Ware stock alert. Must never be used in Consumer contracts.
 * `availableStock` is `current_stock - reserved_stock` of an active Ware.
 */
export interface AdminDashboardInventoryAlert {
    wareId: string;
    wareCode: string | null;
    name: string;
    availableStock: number;
}

/** Admin dashboard aggregate returned by `GET /api/admin/overview`. */
export interface AdminDashboardOverview {
    generatedAt: string;

    orders: {
        /** Orders in `PAID` or `PROCESSING` status. */
        pendingFulfillmentCount: number;
    };

    todayOrders: {
        /** Non-cancelled orders placed today (Asia/Seoul). */
        count: number;
        totalAmount: number;
    };

    refunds: {
        requestedCount: number;
    };

    inventory: {
        lowStockThreshold: number;
        lowStockCount: number;
        outOfStockCount: number;
        alerts: AdminDashboardInventoryAlert[];
    };

    productPosts: {
        totalCount: number;
        publishedCount: number;
    };

    users: {
        totalCount: number;
        todayNewCount: number;
    };
}
