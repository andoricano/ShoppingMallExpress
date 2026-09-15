// controllers/client/payment.controller.ts

import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import { toCamelCase } from "../../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

interface ReservePointPayload {
    amount: number;
}

// ==========================================
// 1. Point Reservation
// ==========================================

export const reservePoint = async (
    req: Request<
        {},
        {},
        ReservePointPayload
    >,
    res: Response,
) => {
    try {
        // ==========================================
        // Authorization
        // ==========================================

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith(
                "Bearer ",
            )
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
                process.env[
                "SUPABASE_URL"
                ]!,
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
        // Auth User
        // ==========================================

        const {
            data: {
                user,
            },
            error: userError,
        } =
            await userSupabase.auth.getUser();

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
        // Payload
        // ==========================================

        const {
            amount,
        } = req.body;

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "예약할 포인트는 0보다 큰 정수여야 합니다.",
            });
        }

        // ==========================================
        // Point Reservation RPC
        // ==========================================

        const {
            data,
            error,
        } =
            await userSupabase.rpc(
                "reserve_point",
                {
                    p_client_id:
                        user.id,
                    p_amount:
                        amount,
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
            "Reserve point failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "포인트 예약에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};