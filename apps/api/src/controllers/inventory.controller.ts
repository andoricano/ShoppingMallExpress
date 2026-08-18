import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import type {
    StockStatus,
    AdjustmentReason,
    AdjustStockPayload,
    InventoryFilterParams
} from '@mall/types';

const calculateStatus = (currentStock: number, safetyStock: number, isCurrentlyDisabled: boolean): StockStatus => {
    if (isCurrentlyDisabled) return "DISABLED";
    if (currentStock <= 0) return "SOLD_OUT";
    if (currentStock <= safetyStock) return "LOW_STOCK";
    return "IN_STOCK";
};

// 1. 재고 목록 조회 (검색/필터 지원)
export const getInventoryItems = async (
    req: Request<{}, {}, {}, InventoryFilterParams>,
    res: Response
) => {
    try {
        const { searchQuery, status } = req.query;

        let query = supabase.from('inventory_items').select('*');

        if (status) {
            query = query.eq('status', status);
        }

        if (searchQuery) {
            query = query.or(`product_name.ilike.%${searchQuery}%,sku_id.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Select failed:', error);
        res.status(500).json({
            success: false,
            message: '재고 목록 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 2. 감사 로그 조회 (PRD 3.6)
export const getInventoryLogs = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('inventory_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Select logs failed:', error);
        res.status(500).json({
            success: false,
            message: '감사 로그 조회에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 3. 신규 SKU 등록 및 초기 재고 설정 (PRD 3.1)
interface CreateItemPayload {
    skuId: string;
    productId: string;
    productName: string;
    initialStock?: number;
    safetyStock?: number;
}

export const createInventoryItem = async (
    req: Request<{}, {}, CreateItemPayload>,
    res: Response
) => {
    try {
        const { skuId, productId, productName, initialStock, safetyStock } = req.body;

        const currentStock = Number(initialStock) || 0;
        const safety = Number(safetyStock) || 0;
        const status: StockStatus = calculateStatus(currentStock, safety, false);

        // SKU 생성 및 저장
        const { data, error } = await supabase
            .from('inventory_items')
            .insert({
                sku_id: skuId,
                product_id: productId,
                product_name: productName,
                current_stock: currentStock,
                safety_stock: safety,
                status: status,
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Insert failed:', error);
        res.status(500).json({
            success: false,
            message: 'SKU 생성에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 4. 어드민 재고 수동 조정 (+ 감사 로그 생성) (PRD 3.3 & 3.6)
interface ExtendedAdjustPayload extends Partial<AdjustStockPayload> {
    deltaQty?: number;
}

export const adjustInventoryStock = async (
    req: Request<{}, {}, ExtendedAdjustPayload>,
    res: Response
) => {
    try {
        const { skuId, deltaQty, adjustmentQty, reasonType, reasonMemo, adminId } = req.body;

        const changeQty = deltaQty ?? adjustmentQty ?? 0;

        if (!skuId) {
            return res.status(400).json({
                success: false,
                message: 'SKU ID가 필요합니다.',
            });
        }

        // [STEP 1] 현재 재고 상태 조회
        const { data: item, error: fetchError } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('sku_id', skuId)
            .single();

        if (fetchError || !item) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 SKU입니다.',
            });
        }

        // [STEP 2] 조정 후 수량 및 상태 계산
        const beforeQty = item.current_stock;
        const afterQty = Math.max(0, beforeQty + Number(changeQty));
        const newStatus: StockStatus = calculateStatus(afterQty, item.safety_stock, item.status === 'DISABLED');

        // [STEP 3] 재고 수량 업데이트
        const { data: updatedItem, error: updateError } = await supabase
            .from('inventory_items')
            .update({
                current_stock: afterQty,
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('sku_id', skuId)
            .select()
            .single();

        if (updateError) throw updateError;

        // [STEP 4] 감사 로그(Audit Log) 생성
        const { error: logError } = await supabase
            .from('inventory_logs')
            .insert({
                sku_id: skuId,
                before_qty: beforeQty,
                after_qty: afterQty,
                change_type: 'ADMIN_ADJUST',
                reason_type: reasonType as AdjustmentReason, // [수정] AdjustmentReason 타입 캐스팅
                admin_id: adminId || 'SYSTEM_ADMIN',
                reason_memo: reasonMemo ? `[${reasonType || 'ADJUST'}] ${reasonMemo}`.trim() : `[${reasonType || 'ADJUST'}]`,
            });

        if (logError) console.error('Audit Log 생성 실패:', logError);

        res.json({
            success: true,
            data: updatedItem,
        });
    } catch (error) {
        console.error('Adjustment failed:', error);
        res.status(500).json({
            success: false,
            message: '재고 수동 조정에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 5. 단순 SKU 정보 업데이트 (안전재고 설정 변경 등)
interface UpdateItemPayload {
    productName?: string;
    safetyStock?: number;
}

export const updateInventoryItem = async (
    req: Request<{ uuid: string }, {}, UpdateItemPayload>,
    res: Response
) => {
    try {
        const { uuid } = req.params; // sku_id 기준
        const { productName, safetyStock } = req.body;

        // [STEP 1] 현재 아이템 상태 확인
        const { data: currentItem, error: fetchError } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('sku_id', uuid)
            .single();

        if (fetchError || !currentItem) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 SKU입니다.',
            });
        }

        const newSafetyStock = safetyStock !== undefined ? Number(safetyStock) : currentItem.safety_stock;
        const newStatus: StockStatus = calculateStatus(
            currentItem.current_stock,
            newSafetyStock,
            currentItem.status === 'DISABLED'
        );

        // [STEP 2] 정보 업데이트
        const { data, error } = await supabase
            .from('inventory_items')
            .update({
                product_name: productName ?? currentItem.product_name,
                safety_stock: newSafetyStock,
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('sku_id', uuid)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Update failed:', error);
        res.status(500).json({
            success: false,
            message: 'SKU 정보 수정에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 6. SKU 비활성화 / 활성화 (논리적 삭제) (PRD 3.7)
export const toggleInventoryStatus = async (
    req: Request<{ uuid: string }>,
    res: Response
) => {
    try {
        const { uuid } = req.params; // sku_id

        // [STEP 1] 대상 조회
        const { data: item, error: fetchError } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('sku_id', uuid)
            .single();

        if (fetchError || !item) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 SKU입니다.',
            });
        }

        // [STEP 2] 물리 삭제 대신 DISABLED ↔ 활성화 상태 토글
        const isCurrentlyDisabled = item.status === 'DISABLED';
        // [수정] StockStatus 타입 지정
        const nextStatus: StockStatus = calculateStatus(
            item.current_stock,
            item.safety_stock,
            !isCurrentlyDisabled // 토글 처리
        );

        const { data, error } = await supabase
            .from('inventory_items')
            .update({
                status: nextStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('sku_id', uuid)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Toggle status failed:', error);
        res.status(500).json({
            success: false,
            message: '상태 변경(논리적 삭제) 처리에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};