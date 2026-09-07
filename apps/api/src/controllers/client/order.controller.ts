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
// Request Validation
// ==========================================

function validateCreateOrder(
    payload: CreateOrderPayload,
) {
    if (!payload.clientId) {
        return "clientId가 필요합니다.";
    }

    if (!payload.paymentId) {
        return "paymentId가 필요합니다.";
    }

    if (
        !Array.isArray(payload.items) ||
        payload.items.length === 0
    ) {
        return "주문 상품이 없습니다.";
    }

    return null;
}

// ==========================================
// Client 주문 생성
// ==========================================

export const createOrder = async (
    req: Request<
        {},
        {},
        CreateOrderPayload
    >,
    res: Response,
) => {
    try {
        const payload = req.body;

        const validationError =
            validateCreateOrder(
                payload,
            );

        if (validationError) {
            return res.status(400).json({
                success: false,
                message:
                    validationError,
            });
        }

        const {
            data,
            error,
        } = await supabase.rpc(
            "create_order",
            {
                p_client_id:
                    payload.clientId,

                p_payment_id:
                    payload.paymentId,

                p_shipping_address:
                    payload.shippingAddress,

                p_items:
                    payload.items,
            },
        );

        if (error) {
            throw error;
        }

        return res.status(201).json({
            success: true,
            data: toCamelCase(data),
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