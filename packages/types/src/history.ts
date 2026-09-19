// @/types/history.ts

import type { OrderStatus } from "./order.js";


export type HistoryActorType =
    | "CLIENT"
    | "ADMIN"
    | "SYSTEM";

export type HistoryTargetType =
    | "ORDER"
    | "ORDER_ITEM"
    | "PRODUCT"
    | "INVENTORY"
    | "USER";

export type HistoryAction =
    | "ORDER_CREATED"
    | "ORDER_SHIPPED"
    | "ORDER_COMPLETED"
    | "ORDER_CANCELLED"
    | "STOCK_DEDUCTED"
    | "STOCK_RESTORED"
    | "USER_UPDATED"
    | "USER_ROLE_CHANGED";

export type HistoryMetadata =
    Record<string, unknown>;

export interface History {
    id: string;

    actorType: HistoryActorType;
    actorId: string | null;

    targetType: HistoryTargetType;
    targetId: string;

    action: HistoryAction;

    metadata: HistoryMetadata | null;

    createdAt: string;
}

export interface ClientHistoryItem {
    id: string;
    action: HistoryAction;
    createdAt: string;

    order: {
        id: string;
        status: OrderStatus;
        totalPrice: number;
        createdAt: string;

        items: {
            id: string;
            productId: string;
            productName: string;
            price: number;
            quantity: number;

            product: {
                id: string;
                name: string;
                mainImageUrl: string;
            };
        }[];
    };
}