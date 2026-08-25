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

// [공통 헬퍼] 하위 SKU 재고 합산 후 상위 inventory_items.total_stock 동기화
const syncTotalStock = async (inventoryItemId: string) => {
    if (!inventoryItemId) return;

    const { data: skus } = await supabase
        .from('sku_inventories')
        .select('current_stock')
        .eq('inventory_item_id', inventoryItemId);

    if (skus) {
        const totalStock = skus.reduce((sum, sku) => sum + (sku.current_stock || 0), 0);
        await supabase
            .from('inventory_items')
            .update({ total_stock: totalStock, updated_at: new Date().toISOString() })
            .eq('id', inventoryItemId);
    }
};

// 1. 재고 목록 조회 (하위 SKU 조인 및 검색/필터 지원)
export const getInventoryItems = async (
    req: Request<{}, {}, {}, InventoryFilterParams>,
    res: Response
) => {
    try {
        const { searchQuery, status } = req.query;

        // status 필터 적용 시 !inner 조인을 사용해 해당 상태를 가진 SKU가 포함된 그룹만 필터링
        const selectQuery = status
            ? '*, skus:sku_inventories!inner(*)'
            : '*, skus:sku_inventories(*)';

        let query = supabase.from('inventory_items').select(selectQuery);

        if (status) {
            query = query.eq('sku_inventories.status', status);
        }

        if (searchQuery) {
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

// 3. 신규 SKU 및 재고 그룹 등록 (유연한 네이밍 & 다중 SKU 배열 대응)
interface CreateItemPayload {
    id?: string;
    inventoryItemId?: string;
    name?: string;
    inventoryItemName?: string;
    category?: string;
    skuId?: string;
    optionName?: string;
    initialStock?: number;
    totalStock?: number;
    total_stock?: number;
    safetyStock?: number;
    safety_stock?: number;
    skus?: Array<{
        id?: string;
        skuId?: string;
        optionName?: string;
        option_name?: string;
        currentStock?: number;
        current_stock?: number;
        safetyStock?: number;
        safety_stock?: number;
    }>;
}

export const createInventoryItem = async (
    req: Request<{}, {}, CreateItemPayload>,
    res: Response
) => {
    try {
        const body = req.body;

        // 프론트엔드 모달 카멜케이스(id, name)와 기존 백엔드(inventoryItemId, inventoryItemName) 필드 유연 매핑
        const itemId = body.inventoryItemId || body.id;
        const itemName = body.inventoryItemName || body.name;
        const category = body.category || null;

        if (!itemId || !itemName) {
            return res.status(400).json({
                success: false,
                message: '재고 그룹 ID와 상품명(name)은 필수입니다.',
            });
        }

        // 다중 SKU 배열(`skus`)이 넘어오는 경우와 단일 SKU 필드로 전달되는 경우 모두 처리
        const skusToInsert = body.skus && body.skus.length > 0
            ? body.skus.map((s, idx) => {
                const sStock = Number(s.currentStock ?? s.current_stock ?? body.initialStock ?? body.totalStock ?? 0);
                const sSafety = Number(s.safetyStock ?? s.safety_stock ?? body.safetyStock ?? 0);
                return {
                    id: s.skuId || s.id || `${itemId}-SKU-${idx + 1}`,
                    inventory_item_id: itemId,
                    option_name: s.optionName || s.option_name || `옵션 ${idx + 1}`,
                    current_stock: sStock,
                    safety_stock: sSafety,
                    status: calculateStatus(sStock, sSafety, false),
                };
            })
            : [{
                id: body.skuId || `${itemId}-SKU-1`,
                inventory_item_id: itemId,
                option_name: body.optionName || '기본 옵션',
                current_stock: Number(body.initialStock ?? body.totalStock ?? body.total_stock ?? 0),
                safety_stock: Number(body.safetyStock ?? body.safety_stock ?? 0),
                status: calculateStatus(
                    Number(body.initialStock ?? body.totalStock ?? body.total_stock ?? 0),
                    Number(body.safetyStock ?? body.safety_stock ?? 0),
                    false
                ),
            }];

        const initialTotalStock = skusToInsert.reduce((acc, s) => acc + s.current_stock, 0);

        // 1) inventory_items 상위 그룹 등록 (upsert)
        const { error: itemError } = await supabase
            .from('inventory_items')
            .upsert({
                id: itemId,
                name: itemName,
                category: category,
                total_stock: initialTotalStock,
                updated_at: new Date().toISOString(),
            });

        if (itemError) throw itemError;

        // 2) sku_inventories 하위 개별 SKU 등록 (upsert)
        const { data: insertedSkus, error: skuError } = await supabase
            .from('sku_inventories')
            .upsert(skusToInsert)
            .select();

        if (skuError) throw skuError;

        // 3) 상위 그룹 총 재고 수량 동기화
        await syncTotalStock(itemId);

        res.status(201).json({
            success: true,
            data: insertedSkus,
        });
    } catch (error) {
        console.error('Insert failed:', error);
        res.status(500).json({
            success: false,
            message: 'SKU 및 재고 생성에 실패했습니다.',
            error: error instanceof Error ? error.message : JSON.stringify(error),
        });
    }
};

// 4. 어드민 재고 수동 조정 (+ 감사 로그 생성 및 상위 총 재고 동기화)
interface ExtendedAdjustPayload extends Partial<AdjustStockPayload> {
    skuId?: string;
    deltaQty?: number;
    adjustmentQty?: number;
    reasonType?: AdjustmentReason;
    reasonMemo?: string;
    adminId?: string;
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

        // [STEP 1] 현재 SKU 재고 상태 조회
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

        // [STEP 4] 상위 inventory_items의 total_stock 수량 자동 갱신
        await syncTotalStock(item.inventory_item_id);

        // [STEP 5] 감사 로그(Audit Log) 생성
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
    option_name?: string;
    safetyStock?: number;
    safety_stock?: number;
}

export const updateInventoryItem = async (
    req: Request<{ uuid: string }, {}, UpdateSkuPayload>,
    res: Response
) => {
    try {
        const { uuid } = req.params; // skuId 기준
        const { optionName, option_name, safetyStock, safety_stock } = req.body;

        const targetOptionName = optionName ?? option_name;
        const inputSafetyStock = safetyStock ?? safety_stock;

        // [STEP 1] 현재 SKU 상태 확인
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

        const newSafetyStock = inputSafetyStock !== undefined ? Number(inputSafetyStock) : currentSku.safety_stock;
        const newStatus: StockStatus = calculateStatus(
            currentSku.current_stock,
            newSafetyStock,
            currentSku.status === 'DISABLED'
        );

        // [STEP 2] SKU 정보 업데이트
        const { data, error } = await supabase
            .from('sku_inventories')
            .update({
                option_name: targetOptionName ?? currentSku.option_name,
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

// 6. SKU 비활성화 / 활성화 (논리적 삭제)
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