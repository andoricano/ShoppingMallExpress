// controllers/order.controller.ts

import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { toCamelCase } from "../utils/caseConverter.js";


// ==========================================
// Types
// ==========================================

interface CreateOrderItemPayload {
    productId: string;
    quantity: number;
}

interface CreateOrderPayload {
    clientId: string;
    paymentId: string;
    items: CreateOrderItemPayload[];
    shippingAddress: Record<string, unknown>;
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
            items,
            shippingAddress,
        } = req.body;

        if (
            !clientId ||
            !paymentId ||
            !shippingAddress ||
            !items?.length
        ) {
            return res.status(400).json({
                success: false,
                message: "주문 정보가 부족합니다.",
            });
        }

        let totalPrice = 0;

        const orderItems = [];

        // Product / Inventory 확인 및 Snapshot 생성
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "주문 상품 정보가 올바르지 않습니다.",
                });
            }

            const { data: product, error: productError } = await supabase
                .from("products")
                .select("*")
                .eq("id", item.productId)
                .eq("is_active", true)
                .single();

            if (productError || !product) {
                return res.status(404).json({
                    success: false,
                    message: "주문할 상품을 찾을 수 없습니다.",
                });
            }

            const { data: inventory, error: inventoryError } =
                await supabase
                    .from("inventory_items")
                    .select("*")
                    .eq("id", product.inventory_id)
                    .eq("is_active", true)
                    .single();

            if (inventoryError || !inventory) {
                return res.status(400).json({
                    success: false,
                    message: "상품에 연결된 재고를 찾을 수 없습니다.",
                });
            }

            totalPrice += product.price * item.quantity;

            orderItems.push({
                product_id: product.id,
                inventory_id: inventory.id,
                product_name: product.name,
                sku_code: inventory.sku_code,
                price: product.price,
                quantity: item.quantity,
                inventory_meta: inventory.meta ?? null,
            });
        }

        // ==========================================
        // Order 생성
        // ==========================================

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

        // ==========================================
        // 재고 차감 + Order Item 생성
        // ==========================================

        const createdItems = [];

        for (const item of orderItems) {
            const { data: inventory, error: inventoryError } =
                await supabase.rpc("adjust_inventory_stock", {
                    p_sku_id: item.inventory_id,
                    p_adjustment_qty: -item.quantity,
                });

            if (inventoryError) {
                throw inventoryError;
            }

            if (!inventory) {
                throw new Error("재고 차감에 실패했습니다.");
            }

            const { data: orderItem, error: itemError } = await supabase
                .from("order_items")
                .insert({
                    order_id: order.id,
                    product_id: item.product_id,
                    inventory_id: item.inventory_id,
                    product_name: item.product_name,
                    sku_code: item.sku_code,
                    price: item.price,
                    quantity: item.quantity,
                    inventory_meta: item.inventory_meta,
                })
                .select()
                .single();

            if (itemError) {
                throw itemError;
            }

            createdItems.push(orderItem);
        }

        return res.status(201).json({
            success: true,
            data: toCamelCase({
                ...order,
                order_items: createdItems,
            }),
        });
    } catch (error) {
        console.error("Create order failed:", error);

        return res.status(500).json({
            success: false,
            message: "주문 생성에 실패했습니다.",
            error:
                error instanceof Error
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
            error:
                error instanceof Error
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
            error:
                error instanceof Error
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
                message: "배송사와 송장번호를 입력해주세요.",
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
            error:
                error instanceof Error
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
            .select(`
                id,
                status,
                order_items (*)
            `)
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

        // 주문 취소에 따른 재고 복구
        for (const item of order.order_items) {
            const { error: inventoryError } = await supabase.rpc(
                "adjust_inventory_stock",
                {
                    p_sku_id: item.inventory_id,
                    p_adjustment_qty: item.quantity,
                }
            );

            if (inventoryError) {
                throw inventoryError;
            }
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
            error:
                error instanceof Error
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
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};