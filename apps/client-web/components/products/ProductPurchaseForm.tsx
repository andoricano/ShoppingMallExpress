"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductOption } from "@mall/types";

interface ProductPurchaseFormProps {
  product: Product;
}

export default function ProductPurchaseForm({ product }: ProductPurchaseFormProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<ProductOption | null>(
    product.options.length > 0 ? null : null
  );
  const [quantity, setQuantity] = useState<number>(1);

  const { basePrice, discountedPrice, discountValue, discountType } = product.price;
  const hasDiscount = basePrice > discountedPrice;

  // 옵션 추가금 반영 단가
  const unitPrice = discountedPrice + (selectedOption?.surcharge || 0);
  const totalPrice = unitPrice * quantity;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    if (product.options.length > 0 && !selectedOption) {
      alert("옵션을 선택해주세요.");
      return;
    }
    // 장바구니 담기 로직 (Zustand / Context 연결 지점)
    alert("장바구니에 상품이 담겼습니다.");
  };

  const handleBuyNow = () => {
    if (product.options.length > 0 && !selectedOption) {
      alert("옵션을 선택해주세요.");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 상품 기본 정보 */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          {product.productName}
        </h1>
        <p className="text-sm text-neutral-500">{product.description}</p>
      </div>

      {/* 가격 정보 */}
      <div className="border-y border-neutral-200 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-neutral-900">
            {discountedPrice.toLocaleString()}원
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm text-neutral-400 line-through">
                {basePrice.toLocaleString()}원
              </span>
              <span className="text-sm font-bold text-red-600">
                {discountType === "PERCENTAGE" ? `${discountValue}%` : "할인"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 옵션 선택 */}
      {product.options.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-700">
            옵션 선택
          </label>
          <select
            className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            onChange={(e) => {
              const opt = product.options.find((o) => o.optionId === e.target.value);
              setSelectedOption(opt || null);
            }}
            defaultValue=""
          >
            <option value="" disabled>
              옵션을 선택하세요
            </option>
            {product.options.map((opt) => (
              <option key={opt.optionId} value={opt.optionId}>
                {opt.optionName}: {opt.optionValue}
                {opt.surcharge > 0 ? ` (+${opt.surcharge.toLocaleString()}원)` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 수량 조절 */}
      <div className="flex justify-between items-center py-2">
        <span className="text-sm font-medium text-neutral-700">수량</span>
        <div className="flex items-center border border-neutral-300 rounded">
          <button
            type="button"
            onClick={() => handleQuantityChange(-1)}
            className="px-3 py-1 text-sm hover:bg-neutral-100 border-r border-neutral-300"
          >
            -
          </button>
          <span className="px-4 py-1 text-sm font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => handleQuantityChange(1)}
            className="px-3 py-1 text-sm hover:bg-neutral-100 border-l border-neutral-300"
          >
            +
          </button>
        </div>
      </div>

      {/* 총 결제 금액 */}
      <div className="flex justify-between items-center bg-neutral-50 p-4 rounded">
        <span className="text-sm font-bold text-neutral-700">총 상품 금액</span>
        <span className="text-xl font-bold text-neutral-900">
          {totalPrice.toLocaleString()}원
        </span>
      </div>

      {/* C2A 버튼 */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={handleAddToCart}
          className="w-full border border-black text-black py-3.5 text-sm font-medium hover:bg-neutral-100 transition-colors"
        >
          장바구니 담기
        </button>
        <button
          onClick={handleBuyNow}
          className="w-full bg-black text-white py-3.5 text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          바로 구매하기
        </button>
      </div>
    </div>
  );
}