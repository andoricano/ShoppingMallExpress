import type { Request, Response } from "express";

import { supabase } from "../config/supabase.js";
import { toCamelCase } from "../utils/caseConverter.js";

// ==========================================
// Admin 환불 요청 목록 조회
// ==========================================

export const getRefunds = async (
    req: Request,
    res: Response,
) => {
    try {
        // ==========================================
        // 1. Refund Request 조회
        // ==========================================

        const {
            data: refunds,
            error: refundError,
        } = await supabase
            .from("refund_requests")
            .select(`
                id,
                order_id,
                status,
                reason,
                created_at,
                processed_at
            `)
            .order(
                "created_at",
                {
                    ascending: false,
                },
            );

        if (refundError) {
            throw refundError;
        }

        if (!refunds || refunds.length === 0) {
            return res.json({
                success: true,
                data: [],
            });
        }

        // ==========================================
        // 2. Order ID 추출
        // ==========================================

        const orderIds = refunds.map(
            (refund) =>
                refund.order_id,
        );

        // ==========================================
        // 3. Order 조회
        // ==========================================

        const {
            data: orders,
            error: orderError,
        } = await supabase
            .from("orders")
            .select(`
                id,
                client_id,
                payment_id,
                status,
                total_price,
                shipping_address,
                delivery,
                created_at
            `)
            .in("id", orderIds);

        if (orderError) {
            throw orderError;
        }

        // ==========================================
        // 4. Order Item 조회
        // ==========================================

        const {
            data: orderItems,
            error: orderItemError,
        } = await supabase
            .from("order_items")
            .select(`
                id,
                order_id,
                product_id,
                inventory_id,
                product_name,
                sku_code,
                price,
                quantity,
                inventory_meta
            `)
            .in(
                "order_id",
                orderIds,
            );

        if (orderItemError) {
            throw orderItemError;
        }

        // ==========================================
        // 5. 빠른 조회를 위한 Map
        // ==========================================

        const orderMap =
            new Map(
                (orders ?? []).map(
                    (order) => [
                        order.id,
                        order,
                    ],
                ),
            );

        const orderItemMap =
            new Map<
                string,
                typeof orderItems
            >();

        for (const item of
            orderItems ?? []) {
            const items =
                orderItemMap.get(
                    item.order_id,
                ) ?? [];

            items.push(item);

            orderItemMap.set(
                item.order_id,
                items,
            );
        }

        // ==========================================
        // 6. Refund + Order 조합
        // ==========================================

        const result =
            refunds.map(
                (refund) => {
                    const order =
                        orderMap.get(
                            refund.order_id,
                        );

                    if (!order) {
                        return {
                            id: refund.id,
                            order_id:
                                refund.order_id,
                            status: refund.status,
                            reason: refund.reason,
                            created_at:
                                refund.created_at,
                            processed_at:
                                refund.processed_at,
                            order: null,
                        };
                    }

                    return {
                        id: refund.id,
                        order_id:
                            refund.order_id,
                        status: refund.status,
                        reason: refund.reason,
                        created_at:
                            refund.created_at,
                        processed_at:
                            refund.processed_at,

                        order: {
                            ...order,

                            items:
                                orderItemMap.get(
                                    order.id,
                                ) ?? [],
                        },
                    };
                },
            );

        // ==========================================
        // 7. Response
        // ==========================================

        return res.json({
            success: true,
            data: toCamelCase(
                result,
            ),
        });
    } catch (error) {
        console.error(
            "Get refund requests failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "환불 요청 목록 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};

// ==========================================
// Admin 환불 요청 처리
// ==========================================

export const processRefund = async (
    req: Request<
        {
            id: string;
        },
        {},
        {
            status:
                | "APPROVED"
                | "REJECTED";
        }
    >,
    res: Response,
) => {
    try {
        const { id } =
            req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "환불 요청 ID가 필요합니다.",
            });
        }

        const { status } =
            req.body;

        if (
            status !== "APPROVED" &&
            status !== "REJECTED"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "올바른 환불 처리 상태가 필요합니다.",
            });
        }

        const {
            data,
            error,
        } = await supabase.rpc(
            "process_refund_request",
            {
                p_refund_id: id,
                p_status: status,
            },
        );

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "Process refund request failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "환불 요청 처리에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};