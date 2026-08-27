import type { DiscountType } from "@mall/types";

// 할인 가격 자동 계산 헬퍼 함수 (PRD 3.6)
export const calculateDiscountedPrice = (
  basePrice: number,
  discountType?: DiscountType,
  discountValue?: number,
  startDate?: string,
  endDate?: string
): number => {
  if (!discountType || !discountValue || discountValue <= 0) {
    return basePrice;
  }

  const now = new Date();
  if (startDate && new Date(startDate) > now) return basePrice;
  if (endDate && new Date(endDate) < now) return basePrice;

  if (discountType === 'FIXED_AMOUNT') {
    return Math.max(0, basePrice - discountValue);
  } else if (discountType === 'PERCENTAGE') {
    const discountAmount = (basePrice * discountValue) / 100;
    return Math.max(0, basePrice - discountAmount);
  }

  return basePrice;
};