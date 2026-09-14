import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import { toCamelCase } from "../../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

interface CreateRefundPayload {
    orderId: string;
    reason?: string;
}

// ==========================================
// Client 환불 요청
// ==========================================

export const createRefundRequest = async (
    req: Request<
        {},
        {},
        {
            orderId: string;
            reason?: string;
        }
    >,
    res: Response,
) => {
    try {
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

        const {
            orderId,
            reason,
        } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message:
                    "주문 ID가 필요합니다.",
            });
        }

        const {
            data,
            error,
        } = await userSupabase.rpc(
            "create_refund_request",
            {
                p_order_id:
                    orderId,
                p_client_id:
                    user.id,
                p_reason:
                    reason ?? null,
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
            "Create refund request failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "환불 요청 생성에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};