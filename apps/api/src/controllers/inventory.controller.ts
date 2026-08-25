import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import type {
    StockStatus,
    InventoryFilterParams,
    AdjustStockPayload,
    AdjustmentReason
} from '@mall/types';

const calculateStatus = (currentStock: number, safetyStock: number, isCurrentlyDisabled: boolean): StockStatus => {
    if (isCurrentlyDisabled) return "DISABLED";
    if (currentStock <= 0) return "SOLD_OUT";
    if (currentStock <= safetyStock) return "LOW_STOCK";
    return "IN_STOCK";
};

// 1. 재고 목록 조회 (하위 SKU 조인 및 검색/필터 지원)
export const getInventoryItems = async (
    req: Request<{}, {}, {}, InventoryFilterParams>,
    res: Response
) => {
    try {
        const { searchQuery, status } = req.query;

        // sku_inventories 관계 조인
        let query = supabase
            .from('inventory_items')
            .select('*, skus:sku_inventories(*)');

        if (status) {
            // 하위 sku_inventories의 status 필터링
            query = query.eq('sku_inventories.status', status);
        }

        if (searchQuery) {
            // 그룹명(name) 또는 SKU ID(id) 기준 검색
            query = query.or(`name.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`);
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

// 2. 감사 로그 조회
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

// 3. 신규 SKU 및 재고 그룹 등록
interface CreateItemPayload {
    inventoryItemId: string;   // 재고 그룹 ID (예: "INV-SHOE-01")
    inventoryItemName: string; // 상품/그룹명 (예: "나이키 운동화")
    category?: string;
    skuId: string;             // 개별 SKU ID (예: "SHOE-01-250")
    optionName: string;        // 옵션명 (예: "250")
    initialStock?: number;
    safetyStock?: number;
}

export const createInventoryItem = async (
    req: Request<{}, {}, CreateItemPayload>,
    res: Response
) => {
    try {
        const {
            inventoryItemId,
            inventoryItemName,
            category,
            skuId,
            optionName,
            initialStock,
            safetyStock
        } = req.body;

        const currentStock = Number(initialStock) || 0;
        const safety = Number(safetyStock) || 0;
        const status: StockStatus = calculateStatus(currentStock, safety, false);

        // 1) inventory_items 상위 그룹 등록 (없을 경우 생성)
        const { error: itemError } = await supabase
            .from('inventory_items')
            .upsert({
                id: inventoryItemId,
                name: inventoryItemName,
                category: category || null,
                total_stock: currentStock,
            });

        if (itemError) throw itemError;

        // 2) sku_inventories 하위 개별 SKU 등록
        const { data, error: skuError } = await supabase
            .from('sku_inventories')
            .insert({
                id: skuId,
                inventory_item_id: inventoryItemId,
                option_name: optionName,
                current_stock: currentStock,
                safety_stock: safety,
                status: status,
            })
            .select()
            .single();

        if (skuError) throw skuError;

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

        // [STEP 1] 현재 SKU 재고 상태 조회 (sku_inventories 대상)
        const { data: item, error: fetchError } = await supabase
            .from('sku_inventories')
            .select('*')
            .eq('id', skuId)
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

        // [STEP 3] SKU 재고 수량 및 상태 업데이트
        const { data: updatedItem, error: updateError } = await supabase
            .from('sku_inventories')
            .update({
                current_stock: afterQty,
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', skuId)
            .select()
            .single();

        if (updateError) throw updateError;

        // [STEP 4] 감사 로그(Audit Log) 생성
        const { error: logError } = await supabase
            .from('inventory_logs')
            .insert({
                sku_id: skuId,
                option_name: item.option_name,
                before_qty: beforeQty,
                after_qty: afterQty,
                change_type: 'ADMIN_ADJUST',
                reason_type: reasonType as AdjustmentReason,
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

// 5. 단순 SKU 정보 업데이트 (안전재고 및 옵션명 변경)
interface UpdateSkuPayload {
    optionName?: string;
    safetyStock?: number;
}

export const updateInventoryItem = async (
    req: Request<{ uuid: string }, {}, UpdateSkuPayload>,
    res: Response
) => {
    try {
        const { uuid } = req.params; // skuId 기준
        const { optionName, safetyStock } = req.body;

        // [STEP 1] 현재 SKU 상태 확인 (sku_inventories 대상)
        const { data: currentSku, error: fetchError } = await supabase
            .from('sku_inventories')
            .select('*')
            .eq('id', uuid)
            .single();

        if (fetchError || !currentSku) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 SKU입니다.',
            });
        }

        const newSafetyStock = safetyStock !== undefined ? Number(safetyStock) : currentSku.safety_stock;
        const newStatus: StockStatus = calculateStatus(
            currentSku.current_stock,
            newSafetyStock,
            currentSku.status === 'DISABLED'
        );

        // [STEP 2] SKU 정보 업데이트
        const { data, error } = await supabase
            .from('sku_inventories')
            .update({
                option_name: optionName ?? currentSku.option_name,
                safety_stock: newSafetyStock,
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', uuid)
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
        const { uuid } = req.params; // skuId 기준

        // [STEP 1] 대상 SKU 조회
        const { data: item, error: fetchError } = await supabase
            .from('sku_inventories')
            .select('*')
            .eq('id', uuid)
            .single();

        if (fetchError || !item) {
            return res.status(404).json({
                success: false,
                message: '존재하지 않는 SKU입니다.',
            });
        }

        // [STEP 2] DISABLED ↔ 기존 상태 토글
        const isCurrentlyDisabled = item.status === 'DISABLED';
        const nextStatus: StockStatus = calculateStatus(
            item.current_stock,
            item.safety_stock,
            !isCurrentlyDisabled
        );

        const { data, error } = await supabase
            .from('sku_inventories')
            .update({
                status: nextStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', uuid)
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