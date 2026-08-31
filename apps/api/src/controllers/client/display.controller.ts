// controllers/client/product.controller.ts

import type { Request, Response } from "express";
import { supabase } from "../../config/supabase.js";
import { toCamelCase } from "../../utils/caseConverter.js";

// ==========================================
// 1. Client 상품 목록 조회
// ==========================================

export const getDisplayProducts = async (
    _req: Request,
    res: Response
) => {
    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Get client products failed:", error);

        return res.status(500).json({
            success: false,
            message: "상품 목록 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};


// ==========================================
// 2. Client 상품 상세 조회
// ==========================================

export const getDisplayProductById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("id", id)
            .eq("is_active", true)
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 상품입니다.",
            });
        }

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Get client product failed:", error);

        return res.status(500).json({
            success: false,
            message: "상품 조회에 실패했습니다.",
            error:
                error instanceof Error
                    ? error.message
                    : JSON.stringify(error),
        });
    }
};