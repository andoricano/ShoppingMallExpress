import type { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import type {
    StockStatus,
    InventoryFilterParams,
    AdjustmentReason
} from '@mall/types';
import { toCamelCase } from '../utils/caseConverter.js';

// ==========================================
// Types & Helpers
// ==========================================

interface LogQueryParams {
    page?: string;
    limit?: string;
}

interface CreateItemPayload {
    id?: string;
    inventoryItemId?: string;
    name?: string;
    inventoryItemName?: string;
    category?: string;
    adminId?: string;
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

const calculateStatus = (currentStock: number, safetyStock: number, isCurrentlyDisabled: boolean): StockStatus => {
    if (isCurrentlyDisabled) return "DISABLED";
    if (currentStock <= 0) return "SOLD_OUT";
    if (currentStock <= safetyStock) return "LOW_STOCK";
    return "IN_STOCK";
};



// ==========================================
// Controllers
// ==========================================
interface InventoryQueryParams extends InventoryFilterParams {
    page?: string;
    limit?: string;
}
// 1. 재고 목록 조회 (하위 SKU 조인 및 검색/필터/페이징 지원)
export const getInventoryItems = async (
    req: Request<{}, {}, {}, InventoryQueryParams>,
    res: Response
) => {
    try {
        const { searchQuery, status } = req.query;
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '50', 10));

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const selectQuery = status
            ? '*, skus:sku_inventories!inner(*)'
            : '*, skus:sku_inventories(*)';

        let query = supabase
            .from('inventory_items')
            .select(selectQuery, { count: 'exact' });

        if (status) {
            query = query.eq('sku_inventories.status', status);
        }

        if (searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        res.json({
            success: true,
            data: toCamelCase(data),
            pagination: {
                page,
                limit,
                totalCount: count ?? 0,
                totalPages: count ? Math.ceil(count / limit) : 0,
            },
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

// 2. 감사 로그 조회 (PRD 3.6 - 페이징 처리 반영)
export const getInventoryLogs = async (
    req: Request<{}, {}, {}, LogQueryParams>,
    res: Response
) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.max(1, parseInt(req.query.limit || '50', 10));

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('inventory_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        res.json({
            success: true,
            data: toCamelCase(data),
            pagination: {
                page,
                limit,
                totalCount: count ?? 0,
                totalPages: count ? Math.ceil(count / limit) : 0,
            },
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

// 3. 신규 SKU 및 재고 그룹 등록 (PRD 3.1 & 3.6 감사로그 반영)
export const createInventoryItem = async (
    req: Request<{}, {}, CreateItemPayload>,
    res: Response
) => {
    try {
        const body = req.body;

        const itemId = body.inventoryItemId || body.id;
        const itemName = body.inventoryItemName || body.name;
        const category = body.category || null;
        const adminId = body.adminId || 'ADMIN-SYSTEM';

        if (!itemId || !itemName) {
            return res.status(400).json({
                success: false,
                message: '재고 그룹 ID와 상품명(name)은 필수입니다.',
            });
        }

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

        // 3) PRD 3.6: 신규 등록에 대한 초기 감사 로그 생성 (Append-Only Audit Log)
        if (insertedSkus && insertedSkus.length > 0) {
            const initialLogs = insertedSkus.map((sku) => ({
                sku_id: sku.id,
                option_name: sku.option_name,
                before_qty: 0,
                after_qty: sku.current_stock,
                change_type: 'ADMIN_ADJUST',
                reason_type: 'INCOMING',
                reason_memo: '신규 SKU 등록 초기 재고 설정',
                admin_id: adminId,
            }));

            await supabase.from('inventory_logs').insert(initialLogs);
        }

        res.status(201).json({
            success: true,
            data: toCamelCase(insertedSkus),
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

// 4. 어드민 재고 수동 조정 (+ 감사 로그 생성) (PRD 3.3, 3.6 & 4.0 - RPC 트랜잭션/동시성 보장)
export const adjustInventoryStock = async (req: Request, res: Response) => {
    try {
        const { skuId, deltaQty, adjustmentQty, reasonType, reasonMemo, adminId } = req.body;
        const changeQty = deltaQty ?? adjustmentQty ?? 0;

        if (!skuId) {
            return res.status(400).json({
                success: false,
                message: 'SKU ID가 필요합니다.',
            });
        }

        // DB Stored Procedure(RPC) 호출로 트랜잭션 및 Lock 보장
        const { data, error } = await supabase.rpc('adjust_sku_stock_transaction', {
            p_sku_id: skuId,
            p_change_qty: Number(changeQty),
            p_reason_type: (reasonType as AdjustmentReason) || 'OTHER',
            p_reason_memo: reasonMemo || '',
            p_admin_id: adminId || 'SYSTEM_ADMIN',
        });

        if (error) throw error;

        res.json({
            success: true,
            data: toCamelCase(data),
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
export const updateInventoryItem = async (
    req: Request<{ uuid: string }>,
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
            data: toCamelCase(data),
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

// 6. SKU 비활성화 / 활성화 (논리적 삭제/복구)
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

        // [STEP 2] DISABLED ↔ 기존 상태 토글 (안전재고/현재재고 기준 계산)
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
            data: toCamelCase(data),
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