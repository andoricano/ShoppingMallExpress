/**
 * @deprecated This legacy SKU/Inventory overview is not a Mall v2 Ware API
 * contract. A v2 Admin overview response has not been finalized.
 */
export interface AdminDashboardInventoryAlert {
    skuId: string;
    skuCode: string;
    currentStock: number;
}

/** @deprecated No finalized Mall v2 Admin overview RPC contract exists yet. */
export interface AdminDashboardOverview {
    generatedAt: string;

    pageConfig: {
        isConfigured: boolean;
    };

    orders: {
        pendingFulfillmentCount: number;
    };

    todayOrders: {
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
