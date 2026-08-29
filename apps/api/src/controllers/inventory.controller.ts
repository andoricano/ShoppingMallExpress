import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { toCamelCase } from '../utils/caseConverter.js';

// ==========================================
// Types
// ==========================================



/**
 * SKU 재고 등록 요청
 */
interface CreateInventoryPayload {
    skuCode: string;
    currentStock?: number;
    isActive?: boolean;
    meta?: Record<string, unknown>;
}

/**
 * SKU 재고 수정 요청
 */
interface UpdateInventoryPayload {
    skuCode?: string;
    isActive?: boolean;
    meta?: Record<string, unknown>;
}

/**
 * 재고 수동 조정 요청
 */
interface AdjustInventoryPayload {
    adjustmentQty: number;
}


// ==========================================
// 1. SKU 재고 조회
// ==========================================
interface InventoryQuery {
    search?: string;
    isActive?: string;
}

export const getInventoryItems = async (
    req: Request<{}, {}, {}, InventoryQuery>,
    res: Response
) => {
    try {
        const { search, isActive } = req.query;

        let query = supabase
            .from('inventory_items')
            .select('*')
            .order('created_at', { ascending: false });

        // SKU 코드 검색
        if (search?.trim()) {
            query = query.ilike('sku_code', `%${search.trim()}%`);
        }

        // 활성 / 비활성 필터
        if (isActive === 'true') {
            query = query.eq('is_active', true);
        } else if (isActive === 'false') {
            query = query.eq('is_active', false);
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('Get inventory failed:', error);

        return res.status(500).json({
            success: false,
            message: '재고 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};


// ==========================================
// 2. SKU 재고 등록
// ==========================================

export const createInventoryItem = async (
    req: Request<{}, {}, CreateInventoryPayload>,
    res: Response
) => {
    try {
        const {
            skuCode,
            currentStock = 0,
            isActive = true,
            meta,
        } = req.body;

        if (!skuCode) {
            return res.status(400).json({
                success: false,
                message: 'skuCode는 필수입니다.',
            });
        }

        if (!Number.isInteger(currentStock) || currentStock < 0) {
            return res.status(400).json({
                success: false,
                message: 'currentStock은 0 이상의 정수여야 합니다.',
            });
        }

        const { data, error } = await supabase
            .from('inventory_items')
            .insert({
                sku_code: skuCode,
                current_stock: currentStock,
                is_active: isActive,
                meta: meta ?? null,
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('Create inventory failed:', error);

        return res.status(500).json({
            success: false,
            message: '재고 생성에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};


// ==========================================
// 3. SKU 정보 수정
// ==========================================

export const updateInventoryItem = async (
    req: Request<{ id: string }, {}, UpdateInventoryPayload>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { skuCode, isActive, meta } = req.body;

        const updateData: Record<string, unknown> = {};

        if (skuCode !== undefined) {
            if (!skuCode.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'skuCode는 비어 있을 수 없습니다.',
                });
            }

            updateData.sku_code = skuCode;
        }

        if (isActive !== undefined) {
            updateData.is_active = isActive;
        }

        if (meta !== undefined) {
            updateData.meta = meta;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: '수정할 항목이 없습니다.',
            });
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('inventory_items')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('Update inventory failed:', error);

        return res.status(500).json({
            success: false,
            message: '재고 정보 수정에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};


// ==========================================
// 4. 어드민 재고 수동 조정
// ==========================================

export const adjustInventoryStock = async (
    req: Request<{ id: string }, {}, AdjustInventoryPayload>,
    res: Response
) => {
    try {
        const { id } = req.params;
        const { adjustmentQty } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'SKU ID가 필요합니다.',
            });
        }

        if (!Number.isInteger(adjustmentQty) || adjustmentQty === 0) {
            return res.status(400).json({
                success: false,
                message: 'adjustmentQty는 0이 아닌 정수여야 합니다.',
            });
        }

        // DB RPC에서 트랜잭션 및 동시성 제어를 처리합니다.
        const { data, error } = await supabase.rpc(
            'adjust_inventory_stock',
            {
                p_sku_id: id,
                p_adjustment_qty: adjustmentQty,
            }
        );

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('Adjust inventory failed:', error);

        return res.status(500).json({
            success: false,
            message: '재고 수동 조정에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// ==========================================
// 5. SKU 활성 / 비활성 상태 변경
// ==========================================

export const toggleInventoryStatus = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        // 대상 Inventory 조회
        const { data: inventory, error: inventoryError } = await supabase
            .from("inventory_items")
            .select("id, is_active")
            .eq("id", id)
            .single();

        if (inventoryError || !inventory) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 재고입니다.",
            });
        }

        const nextIsActive = !inventory.is_active;

        // Inventory 활성화
        if (nextIsActive) {
            const { data, error } = await supabase
                .from("inventory_items")
                .update({
                    is_active: true,
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
        }

        // Inventory 비활성화
        // 연결된 Product도 함께 비활성화
        const { data: product, error: productError } = await supabase
            .from("products")
            .select("id")
            .eq("inventory_id", id)
            .maybeSingle();

        if (productError) throw productError;

        const { data, error } = await supabase
            .from("inventory_items")
            .update({
                is_active: false,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        if (product) {
            const { error: updateProductError } = await supabase
                .from("products")
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", product.id);

            if (updateProductError) throw updateProductError;
        }

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error("Toggle inventory status failed:", error);

        return res.status(500).json({
            success: false,
            message: "재고 활성 상태 변경에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};


// ==========================================
// 6. 비활성 SKU 삭제
// ==========================================

export const deleteInventoryItem = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const { id } = req.params;

        const { data: item, error: fetchError } = await supabase
            .from("inventory_items")
            .select("is_active")
            .eq("id", id)
            .single();

        if (fetchError || !item) {
            return res.status(404).json({
                success: false,
                message: "존재하지 않는 재고입니다.",
            });
        }

        // 활성 상태에서는 삭제 불가
        if (item.is_active) {
            return res.status(400).json({
                success: false,
                message: "활성 상태의 재고는 삭제할 수 없습니다. 먼저 비활성화해주세요.",
            });
        }

        // 연결된 Product가 있는지 확인
        const { data: product, error: productError } = await supabase
            .from("products")
            .select("id")
            .eq("inventory_id", id)
            .maybeSingle();

        if (productError) throw productError;

        if (product) {
            return res.status(409).json({
                success: false,
                message: "상품에 연결된 재고는 삭제할 수 없습니다. 먼저 연결된 상품을 삭제해주세요.",
            });
        }

        const { error } = await supabase
            .from("inventory_items")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return res.json({
            success: true,
            message: "재고가 삭제되었습니다.",
        });
    } catch (error) {
        console.error("Delete inventory failed:", error);

        return res.status(500).json({
            success: false,
            message: "재고 삭제에 실패했습니다.",
            error: error instanceof Error
                ? error.message
                : JSON.stringify(error),
        });
    }
};