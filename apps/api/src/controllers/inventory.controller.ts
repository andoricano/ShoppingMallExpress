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

export const getInventoryItems = async (
    req: Request,
    res: Response
) => {
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .order('created_at', { ascending: false });

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

        const { data: item, error: fetchError } = await supabase
            .from('inventory_items')
            .select('is_active')
            .eq('id', id)
            .single();

        if (fetchError || !item) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 SKU입니다.',
            });
        }

        const { data, error } = await supabase
            .from('inventory_items')
            .update({
                is_active: !item.is_active,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return res.json({
            success: true,
            data: toCamelCase(data),
        });
    } catch (error) {
        console.error('Toggle inventory status failed:', error);

        return res.status(500).json({
            success: false,
            message: '재고 활성 상태 변경에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};