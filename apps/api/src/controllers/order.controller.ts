// controllers/order.controller.ts

import type { Request, Response } from "express";

import { supabase } from "../config/supabase.js";
import { toCamelCase } from "../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

type OrderStatus =
    | "PENDING"
    | "SHIPPING"
    | "COMPLETED"
    | "CANCELLED";

interface UpdateOrderPayload {
    status: OrderStatus;

    delivery?: {
        carrier: string;
        trackingNumber: string;
        shippedAt?: string;
    };
}

// ==========================================
// 1. 주문 목록 조회
// ==========================================

export const getOrders = async (
    _req: Request,
    res: Response,
) => {
    try {
        const {
            data,
            error,
        } = await supabase
            .from("orders")
            .select("*")
            .order(
                "created_at",
                { ascending: false },
            );

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            data: toCamelCase(data ?? []),
        });
    } catch (error) {
        console.error(
            "Get orders failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "주문 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};

// ==========================================
// 2. 주문 상세 조회
// ==========================================

export const getOrderById = async (
    req: Request,
    res: Response,
) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "주문 ID가 필요합니다.",
            });
        }

        // --------------------------------------
        // Order
        // --------------------------------------

        const {
            data: order,
            error: orderError,
        } = await supabase
            .from("orders")
            .select("*")
            .eq("id", id)
            .single();

        if (orderError) {
            if (
                orderError.code === "PGRST116"
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "주문을 찾을 수 없습니다.",
                });
            }

            throw orderError;
        }

        // --------------------------------------
        // Order Items
        // --------------------------------------

        const {
            data: items,
            error: itemError,
        } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", id);

        if (itemError) {
            throw itemError;
        }

        return res.json({
            success: true,
            data: toCamelCase({
                ...order,
                items: items ?? [],
            }),
        });
    } catch (error) {
        console.error(
            "Get order detail failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "주문 상세 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};
// ==========================================
// 3. 주문 상태 변경
// ==========================================

export const updateOrderStatus = async (
    req: Request<
        { id: string },
        {},
        UpdateOrderPayload
    >,
    res: Response,
) => {
    try {
        const { id } = req.params;
        const { status, delivery } = req.body;

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: "주문 ID와 상태가 필요합니다.",
            });
        }

        if (
            status === "SHIPPING" &&
            (!delivery?.carrier ||
                !delivery?.trackingNumber)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "출고 처리에는 배송 정보가 필요합니다.",
            });
        }

        const updateData: Record<string, unknown> = {
            status,
        };

        if (status === "SHIPPING") {
            updateData.delivery = {
                carrier: delivery!.carrier,
                trackingNumber: delivery!.trackingNumber,
                shippedAt:
                    delivery!.shippedAt ??
                    new Date().toISOString(),
            };
        }

        const {
            data,
            error,
        } = await supabase
            .from("orders")
            .update(updateData)
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "Update order status failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "주문 상태 변경에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};