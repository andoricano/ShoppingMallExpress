// controllers/user.controller.ts

import type { Request, Response } from "express";
import {
    supabaseAdmin,
} from "../config/supabase.js";
import { toCamelCase } from "../utils/caseConverter.js";

import type {
    UserProfile,
    UserRole,
} from "@mall/types";

// ==========================================
// Types
// ==========================================

interface UpdateUsersPayload {
    users: UserProfile[];
}

interface DeleteUsersPayload {
    ids: string[];
}

// ==========================================
// 1. 회원 조회
// ==========================================
export const getUsers = async (
    req: Request,
    res: Response,
) => {
    try {
        const {
            data,
            error,
        } = await supabaseAdmin
            .from("users")
            .select("*")
            .order("created_at", {
                ascending: false,
            });

        console.log(
            "[User] Supabase data:",
            data,
        );

        console.log(
            "[User] Supabase error:",
            error,
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
            "[User] 회원 조회 실패:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "회원 목록 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};

// ==========================================
// 2. 회원 전체 수정
// ==========================================

export const updateUsers = async (
    req: Request<
        {},
        {},
        UpdateUsersPayload
    >,
    res: Response,
) => {
    try {
        const { users } = req.body;

        if (!Array.isArray(users)) {
            return res.status(400).json({
                success: false,
                message:
                    "회원 데이터가 올바르지 않습니다.",
            });
        }

        const updatedUsers: unknown[] = [];

        for (const user of users) {
            const { data, error } =
                await supabaseAdmin
                    .from("users")
                    .update({
                        name:
                            user.name ??
                            null,

                        role: user.role,

                        recipient_name:
                            user.role ===
                                "CLIENT"
                                ? user.recipientName ??
                                null
                                : null,

                        phone:
                            user.role ===
                                "CLIENT"
                                ? user.phone ??
                                null
                                : null,

                        zonecode:
                            user.role ===
                                "CLIENT"
                                ? user.address
                                    ?.zonecode ??
                                null
                                : null,

                        address:
                            user.role ===
                                "CLIENT"
                                ? user.address
                                    ?.address ??
                                null
                                : null,

                        address_detail:
                            user.role ===
                                "CLIENT"
                                ? user.address
                                    ?.detail ??
                                null
                                : null,

                        is_onboarded:
                            user.role ===
                                "CLIENT"
                                ? user.isOnboarded
                                : false,

                        updated_at:
                            new Date().toISOString(),
                    })
                    .eq("id", user.id)
                    .select("*")
                    .single();

            if (error) {
                throw error;
            }

            updatedUsers.push(data);
        }

        return res.json({
            success: true,
            data: toCamelCase(
                updatedUsers,
            ),
        });
    } catch (error) {
        console.error(
            "[User] 회원 수정 실패:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "회원 정보 수정에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};

// ==========================================
// 3. 회원 전체 삭제
// ==========================================

export const deleteUsers = async (
    req: Request<
        {},
        {},
        DeleteUsersPayload
    >,
    res: Response,
) => {
    try {
        const { ids } = req.body;

        if (
            !Array.isArray(ids) ||
            ids.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "삭제할 회원 ID가 필요합니다.",
            });
        }

        const {
            data,
            error,
        } = await supabaseAdmin
            .from("users")
            .delete()
            .in("id", ids)
            .select("id");

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error(
            "[User] 회원 삭제 실패:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "회원 삭제에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};