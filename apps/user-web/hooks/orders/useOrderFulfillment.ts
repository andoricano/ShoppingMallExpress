"use client";

import { useCallback, useState } from "react";

import type { AdminOrderAllocationResult, AdminOrderItemShortage } from "@mall/types";

async function call<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const result = await response.json().catch(() => null) as { data?: T; message?: string } | null;

    if (!response.ok) {
        throw new Error(result?.message ?? "요청을 처리하지 못했습니다.");
    }

    return result?.data as T;
}

const post = (body: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

/**
 * Mall v3 Admin fulfillment calls for one Order: the ordered / allocated /
 * shortage view, an explicit additional allocation, and the Admin cancel. All
 * go through the server-only Admin Route Handlers.
 */
export function useOrderFulfillment() {
    const [items, setItems] = useState<AdminOrderItemShortage[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
        setBusy(true);
        setError(null);

        try {
            return await action();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "요청을 처리하지 못했습니다.");
            return null;
        } finally {
            setBusy(false);
        }
    }, []);

    const load = useCallback(
        (orderId: string) =>
            run(async () => {
                const data = await call<AdminOrderItemShortage[]>(`/api/admin/orders/${orderId}/shortage`);
                setItems(data);
                return data;
            }),
        [run],
    );

    const allocate = useCallback(
        (orderId: string, orderItemId?: string) =>
            run(async () => {
                const data = await call<AdminOrderAllocationResult>(
                    `/api/admin/orders/${orderId}/allocate`,
                    post(orderItemId ? { orderItemId } : {}),
                );
                setItems(data.items);
                return data;
            }),
        [run],
    );

    const cancel = useCallback(
        (orderId: string, reason: string | null) =>
            run(() => call<{ outcome: string }>(
                `/api/admin/orders/${orderId}/cancel`,
                post(reason ? { reason } : {}),
            )),
        [run],
    );

    /** Seller-initiated Refund (DN-46): the whole remaining quantity, created for the Client. */
    const createRefund = useCallback(
        (orderId: string, reason: string | null) =>
            run(() => call<{ refundRequestId: string }>(
                `/api/admin/orders/${orderId}/refund`,
                post(reason ? { reason } : {}),
            )),
        [run],
    );

    return { items, busy, error, load, allocate, cancel, createRefund };
}
