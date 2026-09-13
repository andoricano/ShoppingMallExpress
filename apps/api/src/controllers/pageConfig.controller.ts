// controllers/pageConfig.controller.ts

import type {
    Request,
    Response,
} from "express";

import { supabase } from "../config/supabase.js";

// ==========================================
// Types
// ==========================================

interface PageConfigParams {
    key: string;
}

// ==========================================
// 1. Page Config 조회
// ==========================================

export const getPageConfig = async (
    req: Request<PageConfigParams>,
    res: Response,
) => {
    try {
        const { key } = req.params;

        if (!key) {
            return res.status(400).json({
                success: false,
                message:
                    "페이지 설정 key가 필요합니다.",
            });
        }

        const { data, error } =
            await supabase
                .from("site_configs")
                .select("value")
                .eq("key", key)
                .maybeSingle();

        if (error) {
            console.error(
                "[PageConfig] 조회 실패:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "페이지 설정을 불러오지 못했습니다.",
            });
        }

        return res.json({
            success: true,
            data: data?.value ?? null,
        });
    } catch (error) {
        console.error(
            "[PageConfig] 조회 실패:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "페이지 설정을 불러오지 못했습니다.",
        });
    }
};

// ==========================================
// 2. Page Config 저장
// ==========================================

export const updatePageConfig = async (
    req: Request<PageConfigParams>,
    res: Response,
) => {
    try {
        const { key } = req.params;

        if (!key) {
            return res.status(400).json({
                success: false,
                message:
                    "페이지 설정 key가 필요합니다.",
            });
        }

        const { data, error } =
            await supabase
                .from("site_configs")
                .upsert(
                    {
                        key,
                        value: req.body,
                        updated_at:
                            new Date().toISOString(),
                    },
                    {
                        onConflict: "key",
                    },
                )
                .select("value")
                .single();

        if (error) {
            console.error(
                "[PageConfig] 저장 실패:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "페이지 설정을 저장하지 못했습니다.",
            });
        }

        return res.json({
            success: true,
            data: data.value,
        });
    } catch (error) {
        console.error(
            "[PageConfig] 저장 실패:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "페이지 설정을 저장하지 못했습니다.",
        });
    }
};