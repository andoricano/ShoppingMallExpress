import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    supabaseAdmin,
} from "../config/supabase.js";

export async function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const authorization = req.header("authorization");
    const token = authorization?.startsWith("Bearer ")
        ? authorization.slice("Bearer ".length).trim()
        : "";

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "관리자 인증이 필요합니다.",
        });
    }

    try {
        const {
            data: authData,
            error: authError,
        } = await supabaseAdmin.auth.getUser(token);

        if (authError || !authData.user) {
            return res.status(401).json({
                success: false,
                message: "유효하지 않은 인증 정보입니다.",
            });
        }

        const {
            data: profile,
            error: profileError,
        } = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", authData.user.id)
            .maybeSingle();

        if (profileError) {
            return res.status(500).json({
                success: false,
                message: "관리자 권한을 확인하지 못했습니다.",
            });
        }

        if (profile?.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "관리자 권한이 필요합니다.",
            });
        }

        return next();
    } catch {
        return res.status(500).json({
            success: false,
            message: "관리자 권한을 확인하지 못했습니다.",
        });
    }
}
