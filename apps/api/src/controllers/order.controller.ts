// controllers/order.controller.ts

import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { toCamelCase } from "../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

interface CreateOrderPayload {
    clientId: string;
    paymentId: string;
    totalPrice: number;
    shippingAddress: Record<string, unknown>;
    items: CreateOrderItemPayload[];
}

interface CreateOrderItemPayload {
    productId: string;
    inventoryId: string;
    productName: string;
    skuCode: string;
    price: number;
    quantity: number;
    inventoryMeta?: Record<string, unknown>;
}

interface ShippingPayload {
    carrier: string;
    trackingNumber: string;
}

// ==========================================
// 1. 주문 생성
// ==========================================

export const createOrder = async (
    req: Request<{}, {}, CreateOrderPayload>,
    res: Response
) => {
    try {
        const {
            clientId,
            paymentId,
            totalPrice,
            shippingAddress,
            items,
        } = req.body;

        if (!clientId || !paymentId || !shippingAddress || !items?.length) {
            return res.status(400).json({
                success: false,
                message: "주문 정보가 부족합니다.",
            });
        }

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                client_id: clientId,
                payment_id: paymentId,
                status: "PENDING",
                total_price: totalPrice,
                shipping_address: shippingAddress,
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const orderItems = items.map((item) => ({
            order_id: order.id,
            product_id: item.productId,
            inventory_id: item.inventoryId,
            product_name: item.productName,
            sku_code: item.skuCode,
            price: item.price,
            quantity: item.quantity,
            inventory_meta: item.inventoryMeta ?? null,
        }));

        const { error: itemError } = await supabase
            .from("order_items")
            .insert(orderItems);

        if (itemError) throw itemError;

        return res.status(201).json({
            success: true,
            data: toCamelCase(order),
        });
    } catch (error) {
        console.error("Create order failed:", error);

        return res.status(500).json({
            success: false,
            message: "주문 생성에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};

// ==========================================
// 2. 주문 목록 조회
// ==========================================

export const getOrders = async (
    _req: Request,
    res: Response
) => {
    try {
        const { data, error } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (*)
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Get orders failed:", error);

        return res.status(500).json({
            success: false,
            message: "주문 목록 조회에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};

// ==========================================
// 3. 주문 상세 조회
// ==========================================

export const getOrderById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("orders")
            .select(`
                *,
                order_items (*)
            `)
            .eq("id", id)
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 주문입니다.",
            });
        }

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Get order failed:", error);

        return res.status(500).json({
            success: false,
            message: "주문 조회에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};

// ==========================================
// 4. 출고 처리
// ==========================================

export const processShipment = async (
    req: Request<{ id: string }, {}, ShippingPayload>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { carrier, trackingNumber } = req.body;

        if (!carrier || !trackingNumber) {
            return res.status(400).json({
                success: false,
                message: "배송사와 송장번호가 필요합니다.",
            });
        }

        const { data: order, error: fetchError } = await supabase
            .from("orders")
            .select("id, status")
            .eq("id", id)
            .single();

        if (fetchError || !order) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 주문입니다.",
            });
        }

        if (order.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "출고 대기 상태의 주문만 출고할 수 있습니다.",
            });
        }

        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from("orders")
            .update({
                status: "SHIPPING",
                delivery: {
                    carrier,
                    trackingNumber,
                    shippedAt: now,
                },
                shipped_at: now,
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Process shipment failed:", error);

        return res.status(500).json({
            success: false,
            message: "출고 처리에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};

// ==========================================
// 5. 주문 취소
// ==========================================

export const cancelOrder = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { data: order, error: fetchError } = await supabase
            .from("orders")
            .select("id, status")
            .eq("id", id)
            .single();

        if (fetchError || !order) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 주문입니다.",
            });
        }

        if (order.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "출고 대기 상태의 주문만 취소할 수 있습니다.",
            });
        }

        const { data, error } = await supabase
            .from("orders")
            .update({
                status: "CANCELLED",
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Cancel order failed:", error);

        return res.status(500).json({
            success: false,
            message: "주문 취소에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};

// ==========================================
// 6. 배송 완료
// ==========================================

export const completeOrder = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { data: order, error: fetchError } = await supabase
            .from("orders")
            .select("id, status")
            .eq("id", id)
            .single();

        if (fetchError || !order) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 주문입니다.",
            });
        }

        if (order.status !== "SHIPPING") {
            return res.status(400).json({
                success: false,
                message: "배송 중인 주문만 완료할 수 있습니다.",
            });
        }

        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from("orders")
            .update({
                status: "COMPLETED",
                completed_at: now,
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Complete order failed:", error);

        return res.status(500).json({
            success: false,
            message: "배송 완료 처리에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};