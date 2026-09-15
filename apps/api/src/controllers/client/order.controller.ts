// controllers/client/order.controller.ts

import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

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

    pointAmount: number;
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

    if (
        !Number.isInteger(
            payload.pointAmount,
        ) ||
        payload.pointAmount < 0
    ) {
        return "사용할 Point가 올바르지 않습니다.";
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

                p_point_amount:
                    payload.pointAmount,
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

// ==========================================
// Client 주문 상세 조회
// ==========================================

export const getOrderById = async (
    req: Request<{
        id: string;
    }>,
    res: Response,
) => {
    try {
        // ==========================================
        // 1. Authorization
        // ==========================================

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const accessToken =
            authHeader.substring(7);

        // ==========================================
        // 2. User Supabase Client
        // ==========================================

        const userSupabase =
            createClient(
                process.env["SUPABASE_URL"]!,
                process.env[
                "SUPABASE_SECRET_KEY"
                ]!,
                {
                    global: {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,
                        },
                    },
                },
            );

        // ==========================================
        // 3. 현재 Client 확인
        // ==========================================

        const {
            data: {
                user,
            },
            error: userError,
        } = await userSupabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        // ==========================================
        // 4. Order ID 확인
        // ==========================================

        const { id } =
            req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "주문 ID가 필요합니다.",
            });
        }

        // ==========================================
        // 5. Order 조회
        // ==========================================

        const {
            data: order,
            error: orderError,
        } = await userSupabase
            .from("orders")
            .select(`
                id,
                client_id,
                payment_id,
                status,
                total_price,
                shipping_address,
                delivery,
                created_at,

                order_items (
                    id,
                    order_id,
                    product_id,
                    inventory_id,
                    product_name,
                    sku_code,
                    price,
                    quantity,
                    inventory_meta
                )
            `)
            .eq("id", id)
            .eq("client_id", user.id)
            .single();

        if (orderError) {
            throw orderError;
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "주문을 찾을 수 없습니다.",
            });
        }
        // ==========================================
        // 6. Response
        // ==========================================

        return res.json({
            success: true,
            data: toCamelCase({
                id: order.id,
                client_id: order.client_id,
                payment_id: order.payment_id,
                status: order.status,
                total_price: order.total_price,
                shipping_address:
                    order.shipping_address,
                delivery: order.delivery,
                created_at: order.created_at,
                items:
                    order.order_items ??
                    [],
            }),
        });
    } catch (error) {
        console.error(
            "Get client order failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "주문 정보를 불러오지 못했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};


// ==========================================
// Client 주문 취소
// ==========================================

export const cancelOrder = async (
    req: Request<{
        id: string;
    }>,
    res: Response,
) => {
    try {
        // Authorization
        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const accessToken =
            authHeader.substring(7);

        const userSupabase =
            createClient(
                process.env["SUPABASE_URL"]!,
                process.env[
                "SUPABASE_SECRET_KEY"
                ]!,
                {
                    global: {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,
                        },
                    },
                },
            );

        // 현재 Client 확인
        const {
            data: {
                user,
            },
            error: userError,
        } = await userSupabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const { id } =
            req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "주문 ID가 필요합니다.",
            });
        }

        // 주문 취소 RPC
        const {
            data,
            error,
        } = await userSupabase.rpc(
            "cancel_order",
            {
                p_order_id: id,
                p_client_id: user.id,
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
            "Cancel client order failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "주문 취소에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};

interface UpdateOrderPayload {
    shippingAddress: {
        name: string;
        recipient: string;
        phone: string;
        postalCode: string;
        address: string;
        detailAddress?: string;
    };
}

// ==========================================
// Client 주문 정보 수정
// ==========================================

export const updateOrder = async (
    req: Request<
        {
            id: string;
        },
        {},
        UpdateOrderPayload
    >,
    res: Response,
) => {
    try {
        // ==========================================
        // 1. Authorization
        // ==========================================

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const accessToken =
            authHeader.substring(7);

        // ==========================================
        // 2. User Supabase Client
        // ==========================================

        const userSupabase =
            createClient(
                process.env["SUPABASE_URL"]!,
                process.env[
                "SUPABASE_SECRET_KEY"
                ]!,
                {
                    global: {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,
                        },
                    },
                },
            );

        // ==========================================
        // 3. 현재 Client 확인
        // ==========================================

        const {
            data: {
                user,
            },
            error: userError,
        } = await userSupabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        // ==========================================
        // 4. Order ID 확인
        // ==========================================

        const { id } =
            req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "주문 ID가 필요합니다.",
            });
        }

        // ==========================================
        // 5. Request Validation
        // ==========================================

        const {
            shippingAddress,
        } = req.body;

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message:
                    "배송지 정보가 필요합니다.",
            });
        }

        // ==========================================
        // 6. Order 수정 RPC
        // ==========================================

        const {
            data,
            error,
        } = await userSupabase.rpc(
            "update_order",
            {
                p_order_id: id,
                p_client_id: user.id,
                p_shipping_address:
                    shippingAddress,
            },
        );

        if (error) {
            throw error;
        }

        // ==========================================
        // 7. Response
        // ==========================================

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "Update client order failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "주문 정보 수정에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};