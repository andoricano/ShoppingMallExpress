export interface AdminDashboardInventoryAlert {
    skuId: string;
    skuCode: string;
    currentStock: number;
}

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
