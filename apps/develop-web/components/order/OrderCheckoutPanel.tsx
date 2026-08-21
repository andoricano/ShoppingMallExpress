// components/order/OrderCheckoutPanel.tsx
"use client";

import React, { useState } from "react";
// 모노레포 공통 정확한 주문 관련 타입 import
import type {
    PrepareCheckoutPayload,
    CheckoutSummary,
    CreateOrderPayload,
    ShippingInfo,
} from "@mall/types";

interface OrderCheckoutPanelProps {
    /** [PRD 3.3] 주문서 미리보기 금액 계산 모의 API 핸들러 */
    onPrepareCheckout?: (payload: PrepareCheckoutPayload) => Promise<CheckoutSummary | null | undefined>;
    /** [PRD 3.4] 주문 생성 및 재고 점유 모의 API 핸들러 */
    onCreateOrder?: (payload: CreateOrderPayload) => Promise<any>;
}

// 테스트용 기본 상품 아이템 타입
interface CheckoutInputItem {
    productId: string;
    optionId?: string;
    skuId: string;
    quantity: number;
}

export function OrderCheckoutPanel({
    onPrepareCheckout,
    onCreateOrder,
}: OrderCheckoutPanelProps) {
    // 1. 주문 상품 입력 상태 (테스트 편의를 위한 기본값 설정)
    const [items, setItems] = useState<CheckoutInputItem[]>([
        {
            productId: "PROD_001",
            skuId: "SKU_BLACK_XL",
            quantity: 2,
        },
        {
            productId: "PROD_002",
            skuId: "SKU_WHITE_M",
            quantity: 1,
        },
    ]);

    // 2. 배송지 및 수령인 정보 입력 상태 (PRD 3.3 / 3.4 ShippingInfo 반영)
    const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
        recipientName: "홍길동",
        recipientPhone: "010-1234-5678",
        shippingAddress: "서울특별시 강남구 테헤란로 123 4층",
        shippingRequest: "부재 시 문 앞에 놓아주세요.",
        isPickup: false,
        pickupLocation: "",
    });

    // 3. 계산 결과 summary 및 로딩/메시지 상태
    const [summary, setSummary] = useState<CheckoutSummary | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // 상품 항목 수량 수정 핸들러
    const handleQuantityChange = (index: number, newQty: number) => {
        const updated = [...items];
        updated[index].quantity = Math.max(1, newQty);
        setItems(updated);
        setSummary(null); // 수정 시 이전 계산 결과 초기화
    };

    // 상품 항목 삭제 핸들러
    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
        setSummary(null);
    };

    // [PRD 3.3] 주문서 미리보기 계산 실행
    const handleCalculatePreview = async () => {
        if (items.length === 0) {
            setMessage({ type: "error", text: "주문할 상품을 최소 1개 이상 등록해 주세요." });
            return;
        }

        setIsCalculating(true);
        setMessage(null);

        try {
            const payload: PrepareCheckoutPayload = {
                items: items.map((item) => ({
                    productId: item.productId,
                    optionId: item.optionId,
                    skuId: item.skuId,
                    quantity: item.quantity,
                })),
            };

            if (onPrepareCheckout) {
                const res = await onPrepareCheckout(payload);
                if (res) {
                    setSummary(res);
                    setMessage({ type: "success", text: "실시간 주문 예정 금액 계산이 완료되었습니다." });
                }
            } else {
                // 모의 Fallback 응답 처리
                const mockSummary: CheckoutSummary = {
                    totalProductAmount: items.reduce((acc, cur) => acc + cur.quantity * 25000, 0),
                    shippingFee: 3000,
                    discountAmount: 2000,
                    finalAmount: items.reduce((acc, cur) => acc + cur.quantity * 25000, 0) + 3000 - 2000,
                    items: items.map((item, idx) => ({
                        productId: item.productId,
                        productName: `테스트 상품 ${idx + 1}`,
                        skuId: item.skuId,
                        price: 25000,
                        quantity: item.quantity,
                    })),
                };
                setSummary(mockSummary);
                setMessage({ type: "success", text: "[MOCK] 주문 예정 금액이 계산되었습니다." });
            }
        } catch {
            setMessage({ type: "error", text: "금액 계산 중 오류가 발생했습니다." });
        } finally {
            setIsCalculating(false);
        }
    };

    // [PRD 3.4] 최종 주문 생성 및 재고 점유 실행
    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (items.length === 0) {
            setMessage({ type: "error", text: "주문 상품이 없습니다." });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);

        try {
            const payload: CreateOrderPayload = {
                shippingInfo,
                items: items.map((item) => ({
                    productId: item.productId,
                    optionId: item.optionId,
                    skuId: item.skuId,
                    quantity: item.quantity,
                })),
            };

            if (onCreateOrder) {
                await onCreateOrder(payload);
            }
            setMessage({
                type: "success",
                text: "🚀 주문이 생성되었으며 재고가 10분간 성공적으로 점유되었습니다!",
            });
        } catch {
            setMessage({ type: "error", text: "주문 생성에 실패했습니다." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌측: 주문 상품 구성 및 배송 정보 입력 폼 */}
            <div className="space-y-6">
                {/* 1. 주문 대상 상품 선택 및 수량 설정 */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-sm text-gray-800">1. 주문 대상 상품 목록</h3>
                        <span className="text-xs text-gray-400">총 {items.length}개 품목</span>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg text-xs"
                            >
                                <div>
                                    <div className="font-mono font-semibold text-gray-800">
                                        Product: {item.productId}
                                    </div>
                                    <div className="text-gray-500 font-mono text-[11px]">
                                        SKU: {item.skuId}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center border rounded bg-white">
                                        <button
                                            type="button"
                                            onClick={() => handleQuantityChange(idx, item.quantity - 1)}
                                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-100"
                                        >
                                            -
                                        </button>
                                        <span className="px-2 font-bold">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleQuantityChange(idx, item.quantity + 1)}
                                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-100"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="text-red-500 hover:text-red-700 font-medium"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 실시간 계산 요청 버튼 */}
                    <button
                        type="button"
                        onClick={handleCalculatePreview}
                        disabled={isCalculating || items.length === 0}
                        className="w-full py-2 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-900 transition disabled:opacity-50"
                    >
                        {isCalculating ? "금액 계산 중..." : "🔄 주문서 금액 실시간 계산 (PRD 3.3)"}
                    </button>
                </div>

                {/* 2. 배송지 및 수령인 정보 입력 (ShippingInfo) */}
                <form onSubmit={handleCreateOrder} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="border-b pb-3">
                        <h3 className="font-bold text-sm text-gray-800">2. 배송 및 수령 정보</h3>
                    </div>

                    {/* 픽업 여부 토글 */}
                    <div className="flex items-center gap-4 text-xs font-medium">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="radio"
                                name="isPickup"
                                checked={!shippingInfo.isPickup}
                                onChange={() => setShippingInfo({ ...shippingInfo, isPickup: false })}
                                className="text-blue-600"
                            />
                            일반 택배 배송
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="radio"
                                name="isPickup"
                                checked={shippingInfo.isPickup}
                                onChange={() => setShippingInfo({ ...shippingInfo, isPickup: true })}
                                className="text-blue-600"
                            />
                            매장 Direct 픽업
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <label className="block text-gray-600 mb-1">수령인 성명</label>
                            <input
                                type="text"
                                value={shippingInfo.recipientName}
                                onChange={(e) => setShippingInfo({ ...shippingInfo, recipientName: e.target.value })}
                                required
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 mb-1">연락처</label>
                            <input
                                type="text"
                                value={shippingInfo.recipientPhone}
                                onChange={(e) => setShippingInfo({ ...shippingInfo, recipientPhone: e.target.value })}
                                required
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {!shippingInfo.isPickup ? (
                            <div className="col-span-2">
                                <label className="block text-gray-600 mb-1">배송지 주소</label>
                                <input
                                    type="text"
                                    value={shippingInfo.shippingAddress}
                                    onChange={(e) => setShippingInfo({ ...shippingInfo, shippingAddress: e.target.value })}
                                    required
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ) : (
                            <div className="col-span-2">
                                <label className="block text-gray-600 mb-1">픽업 희망 매장 위치</label>
                                <input
                                    type="text"
                                    placeholder="예: 강남점 픽업 데스크"
                                    value={shippingInfo.pickupLocation || ""}
                                    onChange={(e) => setShippingInfo({ ...shippingInfo, pickupLocation: e.target.value })}
                                    required
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        <div className="col-span-2">
                            <label className="block text-gray-600 mb-1">배송/요청사항</label>
                            <input
                                type="text"
                                value={shippingInfo.shippingRequest || ""}
                                onChange={(e) => setShippingInfo({ ...shippingInfo, shippingRequest: e.target.value })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* 최종 주문 생성 버튼 */}
                    <button
                        type="submit"
                        disabled={isSubmitting || items.length === 0}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow disabled:opacity-50"
                    >
                        {isSubmitting ? "주문 생성 중..." : "💳 주문 생성 및 10분 재고 점유 (PRD 3.4)"}
                    </button>
                </form>
            </div>

            {/* 우측: 계산된 주문 요약 (CheckoutSummary) 및 처리 메시지 */}
            <div className="space-y-4">
                {/* 처리 결과 메시지 안내 알림 */}
                {message && (
                    <div
                        className={`p-4 rounded-xl text-xs font-medium border ${message.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-red-50 text-red-800 border-red-200"
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* 주문서 계산 요약 카드 */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-gray-800 border-b pb-3">
                        3. 실시간 주문 계산 요약 (CheckoutSummary)
                    </h3>

                    {summary ? (
                        <div className="space-y-4">
                            {/* 요약 품목 스냅샷 */}
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {summary.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                                        <div>
                                            <span className="font-semibold text-gray-800">{item.productName}</span>
                                            <span className="text-gray-400 text-[10px] block font-mono">SKU: {item.skuId}</span>
                                        </div>
                                        <div className="text-right">
                                            <span>{item.price.toLocaleString()}원</span>
                                            <span className="text-gray-500 ml-1">x {item.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 상세 정산 금액 */}
                            <div className="border-t pt-3 space-y-2 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span>총 상품 금액</span>
                                    <span className="font-medium text-gray-800">{summary.totalProductAmount.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>배송비</span>
                                    <span className="font-medium text-gray-800">+{summary.shippingFee.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>할인 금액</span>
                                    <span className="font-medium">-{summary.discountAmount.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-sm font-bold text-gray-900">
                                    <span>최종 결제 예정 금액</span>
                                    <span className="text-blue-600">{summary.finalAmount.toLocaleString()}원</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400 text-xs">
                            좌측 [주문서 금액 실시간 계산] 버튼을 눌러 정산 금액을 확인하세요.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}