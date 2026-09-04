/**
 * SKU 단위 재고
 */
export interface SkuInventory {
    id: string;

    /** SKU 코드 */
    skuCode: string;

    /** 현재 재고 수량 */
    currentStock: number;

    /** SKU 활성 상태 */
    isActive: boolean;

    /** SKU를 구분하기 위한 사용자 정의 속성 */
    meta?: Record<string, unknown>;
}