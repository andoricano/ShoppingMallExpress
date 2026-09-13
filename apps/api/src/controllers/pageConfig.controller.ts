// controllers/pageConfig.controller.ts

import type {
    Request,
    Response,
} from "express";

import { supabase } from "../config/supabase.js";

const CONFIG_KEY = "main_page";

// ==========================================
// 1. MainPage 설정 조회
// ==========================================

export const getMainPage = async (
    req: Request,
    res: Response,
) => {
    try {
        const { data, error } =
            await supabase
                .from("site_configs")
                .select("value")
                .eq("key", CONFIG_KEY)
                .maybeSingle();

        if (error) {
            console.error(
                "[MainPage] 조회 실패:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "메인 페이지 설정을 불러오지 못했습니다.",
            });
        }

        return res.json({
            success: true,
            data: data?.value ?? null,
        });
    } catch (error) {
        console.error(
            "[MainPage] 조회 실패:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "메인 페이지 설정을 불러오지 못했습니다.",
        });
    }
};

// ==========================================
// 2. MainPage 설정 생성
// ==========================================

export const createMainPage = async (
    req: Request,
    res: Response,
) => {
    try {
        const { data, error } =
            await supabase
                .from("site_configs")
                .insert({
                    key: CONFIG_KEY,
                    value: req.body,
                })
                .select("value")
                .single();

        if (error) {
            console.error(
                "[MainPage] 생성 실패:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "메인 페이지 설정을 생성하지 못했습니다.",
            });
        }

        return res.status(201).json({
            success: true,
            data: data.value,
        });
    } catch (error) {
        console.error(
            "[MainPage] 생성 실패:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "메인 페이지 설정을 생성하지 못했습니다.",
        });
    }
};

// ==========================================
// 3. MainPage 설정 수정
// ==========================================

export const updateMainPage = async (
    req: Request,
    res: Response,
) => {
    try {
        const { data, error } =
            await supabase
                .from("site_configs")
                .update({
                    value: req.body,
                    updated_at:
                        new Date().toISOString(),
                })
                .eq("key", CONFIG_KEY)
                .select("value")
                .single();

        if (error) {
            console.error(
                "[MainPage] 수정 실패:",
                error,
            );

            return res.status(500).json({
                success: false,
                message:
                    "메인 페이지 설정을 수정하지 못했습니다.",
            });
        }

        return res.json({
            success: true,
            data: data.value,
        });
    } catch (error) {
        console.error(
            "[MainPage] 수정 실패:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                "메인 페이지 설정을 수정하지 못했습니다.",
        });
    }
};