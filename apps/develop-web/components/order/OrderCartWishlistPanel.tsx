// components/order/OrderCartWishlistPanel.tsx
"use client";

import React, { useState } from "react";
// 모노레포 공통 정확한 타입 import
import type { CartItem, WishlistItem } from "@mall/types";

interface OrderCartWishlistPanelProps {
    /** 장바구니 아이템 목록 */
    cartItems?: CartItem[];
    /** 위시리스트 아이템 목록 */
    wishlistItems?: WishlistItem[];
    /** 장바구니 수량 변경 핸들러 (수정: cartItemId 적용) */
    onUpdateCartQuantity?: (cartItemId: string, newQuantity: number) => void;
    /** 장바구니 선택 상태 토글 핸들러 (수정: isChecked 속성 조작 추가) */
    onToggleCartCheck?: (cartItemId: string, isChecked: boolean) => void;
    /** 장바구니 아이템 삭제 핸들러 (수정: cartItemId 적용) */
    onRemoveCartItem?: (cartItemId: string) => void;
    /** 장바구니 비우기 핸들러 */
    onClearCart?: () => void;
    /** 위시리스트 -> 장바구니 이동 핸들러 (수정: wishlistId 적용) */
    onMoveWishlistToCart?: (wishlistId: string) => void;
    /** 위시리스트 아이템 삭제 핸들러 (수정: wishlistId 적용) */
    onRemoveWishlistItem?: (wishlistId: string) => void;
}

export function OrderCartWishlistPanel({
    cartItems = [],
    wishlistItems = [],
    onUpdateCartQuantity,
    onToggleCartCheck,
    onRemoveCartItem,
    onClearCart,
    onMoveWishlistToCart,
    onRemoveWishlistItem,
}: OrderCartWishlistPanelProps) {
    // 활성화된 탭 상태 ("cart" | "wishlist")
    const [activeTab, setActiveTab] = useState<"cart" | "wishlist">("cart");

    // 수정: productInfo 내의 가격 정보(discountedPrice 또는 basePrice) 및 optionInfo의 surcharge를 반영한 실시간 단가 계산 함수
    const getItemUnitPrice = (item: CartItem) => {
        const base = item.productInfo?.price?.discountedPrice ?? item.productInfo?.price?.basePrice ?? 0;
        const surcharge = item.optionInfo?.surcharge ?? 0;
        return base + surcharge;
    };

    // 수정: isChecked가 true인 선택 항목들만 집계하여 장바구니 총 금액 계산
    const cartTotalPrice = cartItems
        .filter((item) => item.isChecked)
        .reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);

    return (
        <div className="space-y-4">
            {/* 1. 상단 탭 전환 바 */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 pt-3 rounded-t-xl">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("cart")}
                        className={`pb-3 text-xs font-bold transition-colors relative ${activeTab === "cart"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        🛒 장바구니 목록 ({cartItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("wishlist")}
                        className={`pb-3 text-xs font-bold transition-colors relative ${activeTab === "wishlist"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        ❤️ 위시리스트 ({wishlistItems.length})
                    </button>
                </div>

                {/* 탭별 우측 액션 버튼 */}
                {activeTab === "cart" && cartItems.length > 0 && onClearCart && (
                    <button
                        onClick={onClearCart}
                        className="mb-2 px-2.5 py-1 text-[11px] text-red-600 border border-red-200 rounded hover:bg-red-50 transition"
                    >
                        장바구니 비우기
                    </button>
                )}
            </div>

            {/* 2. 장바구니 탭 콘텐츠 */}
            {activeTab === "cart" && (
                <div className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                                <tr>
                                    {/* 수정: 선택 여부(isChecked) 제어를 위한 체크박스 열 추가 */}
                                    <th className="p-3.5 w-10 text-center">선택</th>
                                    <th className="p-3.5">상품 정보</th>
                                    <th className="p-3.5 text-right">단가</th>
                                    <th className="p-3.5 text-center">수량</th>
                                    <th className="p-3.5 text-right">소계</th>
                                    <th className="p-3.5 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cartItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400">
                                            장바구니가 비어 있습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    cartItems.map((item) => {
                                        const unitPrice = getItemUnitPrice(item);
                                        return (
                                            <tr key={item.cartItemId} className="hover:bg-gray-50/80 transition">
                                                {/* 수정: isChecked 체크박스 바인딩 */}
                                                <td className="p-3.5 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.isChecked}
                                                        onChange={(e) =>
                                                            onToggleCartCheck &&
                                                            onToggleCartCheck(item.cartItemId, e.target.checked)
                                                        }
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                                {/* 수정: productInfo 및 optionInfo 중첩 객체 타입 반영 */}
                                                <td className="p-3.5">
                                                    <div className="font-medium text-gray-900">
                                                        {item.productInfo?.productName ?? "상품 정보 없음"}
                                                    </div>
                                                    {item.optionInfo && (
                                                        <div className="text-[11px] text-gray-500">
                                                            옵션: {item.optionInfo.optionName} ({item.optionInfo.optionValue})
                                                            {item.optionInfo.surcharge > 0 &&
                                                                ` (+${item.optionInfo.surcharge.toLocaleString()}원)`}
                                                        </div>
                                                    )}
                                                    <div className="text-[10px] text-gray-400 font-mono">
                                                        SKU: {item.skuId} | CartItemID: {item.cartItemId}
                                                    </div>
                                                </td>
                                                <td className="p-3.5 text-right text-gray-600">
                                                    {unitPrice.toLocaleString()}원
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    {/* 수정: cartItemId 식별자로 수량 조절 */}
                                                    <div className="inline-flex items-center border border-gray-300 rounded-md bg-white">
                                                        <button
                                                            onClick={() =>
                                                                onUpdateCartQuantity &&
                                                                onUpdateCartQuantity(item.cartItemId, Math.max(1, item.quantity - 1))
                                                            }
                                                            disabled={item.quantity <= 1}
                                                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-2.5 text-xs font-semibold">{item.quantity}</span>
                                                        <button
                                                            onClick={() =>
                                                                onUpdateCartQuantity &&
                                                                onUpdateCartQuantity(item.cartItemId, item.quantity + 1)
                                                            }
                                                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-100"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-3.5 text-right font-semibold text-gray-900">
                                                    {(unitPrice * item.quantity).toLocaleString()}원
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    {/* 수정: cartItemId 식별자로 삭제 */}
                                                    <button
                                                        onClick={() => onRemoveCartItem && onRemoveCartItem(item.cartItemId)}
                                                        className="px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 rounded transition"
                                                    >
                                                        삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 장바구니 선택 항목 합계 금액 요약 */}
                    {cartItems.length > 0 && (
                        <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs font-semibold text-blue-900">
                            <span>선택한 상품 총 결제 예정 금액</span>
                            <span className="text-base text-blue-700">{cartTotalPrice.toLocaleString()}원</span>
                        </div>
                    )}
                </div>
            )}

            {/* 3. 위시리스트 탭 콘텐츠 */}
            {activeTab === "wishlist" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {wishlistItems.length === 0 ? (
                        <div className="col-span-full p-8 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
                            위시리스트에 담긴 상품이 없습니다.
                        </div>
                    ) : (
                        wishlistItems.map((item) => {
                            // 수정: WishlistItem 내 productInfo 기반 가격 추출
                            const price = item.productInfo?.price?.discountedPrice ?? item.productInfo?.price?.basePrice ?? 0;
                            return (
                                <div
                                    key={item.wishlistId}
                                    className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:shadow transition"
                                >
                                    <div>
                                        {/* 수정: WishlistItem 내 productInfo 바인딩 */}
                                        <h4 className="font-semibold text-xs text-gray-900">
                                            {item.productInfo?.productName ?? "상품 정보 없음"}
                                        </h4>
                                        <p className="mt-1 text-xs font-bold text-gray-700">
                                            {price.toLocaleString()}원
                                        </p>
                                        <p className="mt-1 text-[10px] text-gray-400 font-mono">
                                            WishlistID: {item.wishlistId}
                                        </p>
                                        {item.createdAt && (
                                            <p className="mt-0.5 text-[10px] text-gray-400">
                                                담은 날짜: {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                        {/* 수정: wishlistId 기반 이동/삭제 처리 */}
                                        {onMoveWishlistToCart && (
                                            <button
                                                onClick={() => onMoveWishlistToCart(item.wishlistId)}
                                                className="flex-1 py-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                            >
                                                🛒 장바구니 담기
                                            </button>
                                        )}
                                        {onRemoveWishlistItem && (
                                            <button
                                                onClick={() => onRemoveWishlistItem(item.wishlistId)}
                                                className="px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}