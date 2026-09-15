// controllers/client/point.controller.ts

import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import { toCamelCase } from "../../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

interface ChargePointPayload {
    amount: number;
}

// ==========================================
// 1. Client Point 조회
// ==========================================

export const getClientPoint = async (
    req: Request,
    res: Response,
) => {
    try {
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

        const {
            data,
            error,
        } = await userSupabase
            .from("points")
            .select("*")
            .eq(
                "client_id",
                user.id,
            )
            .maybeSingle();

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            data: data
                ? toCamelCase(data)
                : null,
        });
    } catch (error) {
        console.error(
            "Get client point failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "포인트 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};

// ==========================================
// 2. Client Point 충전
// ==========================================

export const chargePoint = async (
    req: Request<
        {},
        {},
        ChargePointPayload
    >,
    res: Response,
) => {
    try {
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
                    "충전 포인트는 0보다 큰 정수여야 합니다.",
            });
        }

        const {
            data,
            error,
        } =
            await userSupabase.rpc(
                "charge_point",
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
            "Charge client point failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "포인트 충전에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};