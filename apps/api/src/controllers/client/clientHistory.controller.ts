import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";

import { toCamelCase } from "../../utils/caseConverter.js";

export const getMyHistory = async (
    req: Request,
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
                process.env["SUPABASE_SECRET_KEY"]!,
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

        if (userError || !user) {
            return res.status(401).json({
                success: false,
                message:
                    "로그인이 필요합니다.",
            });
        }

        const {
            data,
            error,
        } = await userSupabase.rpc(
            "get_my_history",
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
            "Get client history failed:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "History 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};
