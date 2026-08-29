import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { toCamelCase } from "../utils/caseConverter.js";

// ==========================================
// Types
// ==========================================

interface ProductQuery {
    search?: string;
    isActive?: string;
}

interface CreateProductPayload {
    name: string;
    mainImageUrl: string;
    imageUrls?: string[];
    description: string;
    price: number;
    inventoryId: string;
    isActive?: boolean;
}

interface UpdateProductPayload {
    name?: string;
    mainImageUrl?: string;
    imageUrls?: string[];
    description?: string;
    price?: number;
    inventoryId?: string;
    isActive?: boolean;
}


// ==========================================
// 1. Client 상품 목록 조회
// ==========================================

export const getClientProducts = async (
    req: Request,
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
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 2. Admin 상품 목록 조회
// ==========================================

export const getAdminProducts = async (
    req: Request<{}, {}, {}, ProductQuery>,
    res: Response
) => {
    try {
        const { search, isActive } = req.query;

        let query = supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });

        // 상품명 검색
        if (search?.trim()) {
            query = query.ilike(
                "name",
                `%${search.trim()}%`
            );
        }

        // 활성 / 비활성 필터
        if (isActive === "true") {
            query = query.eq("is_active", true);
        } else if (isActive === "false") {
            query = query.eq("is_active", false);
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Get admin products failed:", error);

        return res.status(500).json({
            success: false,
            message: "상품 목록 조회에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 3. Admin 상품 상세 조회
// ==========================================

export const getProductById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("id", id)
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
        console.error("Get product failed:", error);

        return res.status(500).json({
            success: false,
            message: "상품 조회에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 4. 상품 등록
// ==========================================

export const createProduct = async (
    req: Request<{}, {}, CreateProductPayload>,
    res: Response
) => {
    try {
        const {
            name,
            mainImageUrl,
            imageUrls = [],
            description,
            price,
            inventoryId,
            isActive = true,
        } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                success: false,
                message: "상품명은 필수입니다.",
            });
        }

        if (!mainImageUrl?.trim()) {
            return res.status(400).json({
                success: false,
                message: "대표 이미지는 필수입니다.",
            });
        }

        if (!Number.isInteger(price) || price < 0) {
            return res.status(400).json({
                success: false,
                message: "가격은 0 이상의 정수여야 합니다.",
            });
        }

        if (!inventoryId) {
            return res.status(400).json({
                success: false,
                message: "Inventory ID는 필수입니다.",
            });
        }

        // 연결할 Inventory 확인
        const { data: inventory, error: inventoryError } = await supabase
            .from("inventory_items")
            .select("id, is_active")
            .eq("id", inventoryId)
            .single();

        if (inventoryError || !inventory) {
            return res.status(404).json({
                success: false,
                message: "연결할 재고를 찾을 수 없습니다.",
            });
        }

        if (!inventory.is_active) {
            return res.status(400).json({
                success: false,
                message: "비활성화된 재고는 상품에 연결할 수 없습니다.",
            });
        }

        const { data, error } = await supabase
            .from("products")
            .insert({
                name: name.trim(),
                main_image_url: mainImageUrl.trim(),
                image_urls: imageUrls,
                description: description ?? "",
                price,
                inventory_id: inventoryId,
                is_active: isActive,
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Create product failed:", error);

        return res.status(500).json({
            success: false,
            message: "상품 생성에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 5. 상품 정보 수정
// ==========================================

export const updateProduct = async (
    req: Request<{ id: string }, {}, UpdateProductPayload>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const {
            name,
            mainImageUrl,
            imageUrls,
            description,
            price,
            inventoryId,
            isActive,
        } = req.body;

        const updateData: Record<string, unknown> = {};

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "상품명은 비어 있을 수 없습니다.",
                });
            }

            updateData.name = name.trim();
        }

        if (mainImageUrl !== undefined) {
            if (!mainImageUrl.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "대표 이미지는 비어 있을 수 없습니다.",
                });
            }

            updateData.main_image_url = mainImageUrl.trim();
        }

        if (imageUrls !== undefined) {
            updateData.image_urls = imageUrls;
        }

        if (description !== undefined) {
            updateData.description = description;
        }

        if (price !== undefined) {
            if (!Number.isInteger(price) || price < 0) {
                return res.status(400).json({
                    success: false,
                    message: "가격은 0 이상의 정수여야 합니다.",
                });
            }

            updateData.price = price;
        }

        if (inventoryId !== undefined) {
            const { data: inventory, error: inventoryError } = await supabase
                .from("inventory_items")
                .select("id, is_active")
                .eq("id", inventoryId)
                .single();

            if (inventoryError || !inventory) {
                return res.status(404).json({
                    success: false,
                    message: "연결할 재고를 찾을 수 없습니다.",
                });
            }

            if (!inventory.is_active) {
                return res.status(400).json({
                    success: false,
                    message: "비활성화된 재고는 상품에 연결할 수 없습니다.",
                });
            }

            updateData.inventory_id = inventoryId;
        }

        if (isActive !== undefined) {
            updateData.is_active = isActive;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "수정할 항목이 없습니다.",
            });
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from("products")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Update product failed:", error);

        return res.status(500).json({
            success: false,
            message: "상품 수정에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 6. 상품 활성 / 비활성
// ==========================================

export const toggleProductStatus = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { data: product, error: fetchError } = await supabase
            .from("products")
            .select("is_active")
            .eq("id", id)
            .single();

        if (fetchError || !product) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 상품입니다.",
            });
        }

        const { data, error } = await supabase
            .from("products")
            .update({
                is_active: !product.is_active,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Toggle product status failed:", error);

        return res.status(500).json({
            success: false,
            message: "상품 활성 상태 변경에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 7. 비활성 상품 삭제
// ==========================================

export const deleteProduct = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { data: product, error: fetchError } = await supabase
            .from("products")
            .select("is_active")
            .eq("id", id)
            .single();

        if (fetchError || !product) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 상품입니다.",
            });
        }

        if (product.is_active) {
            return res.status(400).json({
                success: false,
                message: "활성 상태의 상품은 삭제할 수 없습니다. 먼저 비활성화해주세요.",
            });
        }

        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return res.json({
            success: true,
            message: "상품이 삭제되었습니다.",
        });
    } catch (error) {
        console.error("Delete product failed:", error);

        return res.status(500).json({
            success: false,
            message: "상품 삭제에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};