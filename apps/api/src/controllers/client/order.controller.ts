// controllers/client/order.controller.ts

import type { Request, Response } from "express";

import { supabase } from "../../config/supabase.js";
import { toCamelCase } from "../../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

interface CreateOrderPayload {
    clientId: string;
    paymentId: string;

    items: {
        productId: string;
        quantity: number;
    }[];

    shippingAddress: {
        recipient: string;
        phone: string;
        postalCode: string;
        address: string;
        detailAddress?: string;
    };
}


// ==========================================
// 1. Client 주문 생성
// ==========================================

export const createOrder = async (
    req: Request<{}, {}, CreateOrderPayload>,
    res: Response,
) => {
    try {
        const {
            clientId,
            paymentId,
            items,
            shippingAddress,
        } = req.body;

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: "clientId가 필요합니다.",
            });
        }

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: "paymentId가 필요합니다.",
            });
        }

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "주문 상품이 없습니다.",
            });
        }

        // ==========================================
        // Product + Inventory 조회
        // ==========================================

        const productIds = items.map(
            (item) => item.productId,
        );

        const {
            data: products,
            error: productError,
        } = await supabase
            .from("products")
            .select(`
                id,
                name,
                price,
                inventory_id,
                inventory_items (
                    id,
                    sku_code,
                    current_stock,
                    is_active,
                    meta
                )
            `)
            .in("id", productIds);

        if (productError) {
            throw productError;
        }

        if (
            !products ||
            products.length !== productIds.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "존재하지 않는 상품이 포함되어 있습니다.",
            });
        }

        // ==========================================
        // Inventory 검증 + 주문 금액 계산
        // ==========================================

        let totalPrice = 0;

        const orderItems = [];

        for (const item of items) {
            if (
                !Number.isInteger(item.quantity) ||
                item.quantity <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "주문 수량이 올바르지 않습니다.",
                });
            }

            const product = products.find(
                (value) =>
                    value.id === item.productId,
            );

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message:
                        "상품을 찾을 수 없습니다.",
                });
            }

            const inventory =
                product.inventory_items?.[0];

            if (!inventory) {
                return res.status(400).json({
                    success: false,
                    message:
                        "상품의 재고 정보를 찾을 수 없습니다.",
                });
            }

            if (!inventory.is_active) {
                return res.status(400).json({
                    success: false,
                    message:
                        "판매할 수 없는 상품이 포함되어 있습니다.",
                });
            }

            if (
                inventory.current_stock <
                item.quantity
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.name}의 재고가 부족합니다.`,
                });
            }

            totalPrice +=
                product.price * item.quantity;

            orderItems.push({
                product_id: product.id,
                inventory_id: inventory.id,

                product_name: product.name,
                sku_code: inventory.sku_code,

                price: product.price,
                quantity: item.quantity,

                inventory_meta:
                    inventory.meta ?? null,
            });
        }

        // ==========================================
        // Order 생성
        // ==========================================

        const {
            data: order,
            error: orderError,
        } = await supabase
            .from("orders")
            .insert({
                client_id: clientId,
                payment_id: paymentId,
                status: "PENDING",
                total_price: totalPrice,
                shipping_address:
                    shippingAddress,
            })
            .select("*")
            .single();

        if (orderError) {
            throw orderError;
        }

        // ==========================================
        // Order Item 생성
        // ==========================================

        const {
            error: itemError,
        } = await supabase
            .from("order_items")
            .insert(
                orderItems.map((item) => ({
                    ...item,
                    order_id: order.id,
                })),
            );

        if (itemError) {
            throw itemError;
        }

        return res.status(201).json({
            success: true,
            data: toCamelCase({
                ...order,
                items: orderItems.map(
                    (item) => ({
                        ...item,
                        order_id: order.id,
                    }),
                ),
            }),
        });
    } catch (error) {
        console.error(
            "Create order failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "주문 생성에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};