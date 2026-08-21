// components/order/OrderDetailModal.tsx
"use client";

import React from "react";
// 모노레포 공통 타입 import
import type { Order, OrderStatus } from "@mall/types";

interface OrderDetailModalProps {
    /** 모달 열림 여부 */
    isOpen: boolean;
    /** 모달 닫기 핸들러 */
    onClose: () => void;
    /** 상세 조회할 주문 객체 */
    order: Order | null;
}

/**
 * 주문 상태별 뱃지 스타일 및 한글 라벨 매핑
 */
const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    PAYMENT_PENDING: {
        label: "결제 대기",
        className: "bg-amber-100 text-amber-800 border-amber-300",
    },
    ORDER_RECEIVED: {
        label: "주문 접수",
        className: "bg-blue-100 text-blue-800 border-blue-300",
    },
    CANCELLED: {
        label: "주문 취소",
        className: "bg-red-100 text-red-800 border-red-300",
    },
    COMPLETED: {
        label: "처리 완료",
        className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
};

export function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
    // 모달이 닫혀있거나 주문 정보가 없으면 렌더링하지 않음
    if (!isOpen || !order) return null;

    const statusInfo = STATUS_CONFIG[order.orderStatus] || {
        label: order.orderStatus,
        className: "bg-gray-100 text-gray-800 border-gray-300",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            {/* 모달 컨테이너 */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">

                {/* 1. 헤더 영역 (주문 번호 및 닫기 버튼) */}
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900">주문 상세 정보</h2>
                            <span
                                className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusInfo.className}`}
                            >
                                {statusInfo.label}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            주문번호: <span className="font-mono text-gray-700">{order.orderId}</span> |
                            주문일시: {new Date(order.createdAt).toLocaleString("ko-KR")}
                        </p>
                    </div>

                    {/* 닫기 버튼 */}
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                        aria-label="모달 닫기"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mt-6 space-y-6">
                    {/* 2. 결제 대기 중인 경우 10분 재고 점유 만료 시간 표시 (PRD 3.4 반영) */}
                    {order.orderStatus === "PAYMENT_PENDING" && order.holdExpiresAt && (
                        <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-800">
                            <strong>⚠️ 재고 점유 안내:</strong> 본 주문은 임시 점유 상태입니다.{" "}
                            <span className="font-semibold text-amber-900 underline">
                                {new Date(order.holdExpiresAt).toLocaleTimeString("ko-KR")}
                            </span>
                            까지 결제가 완료되지 않으면 재고가 자동으로 원복됩니다.
                        </div>
                    )}

                    {/* 3. 배송지 및 수령인 정보 (PRD 2.2 / 3.3 반영) */}
                    <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">
                            {order.shippingInfo.isPickup ? "📍 픽업 매장 정보" : "🚚 배송지 정보"}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                                <span className="font-medium text-gray-500">수령인:</span> {order.shippingInfo.recipientName}
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">연락처:</span> {order.shippingInfo.recipientPhone}
                            </div>
                            {order.shippingInfo.isPickup ? (
                                <div className="col-span-2">
                                    <span className="font-medium text-gray-500">픽업 위치:</span> {order.shippingInfo.pickupLocation || "지정 매장"}
                                </div>
                            ) : (
                                <div className="col-span-2">
                                    <span className="font-medium text-gray-500">주소:</span> {order.shippingInfo.shippingAddress}
                                </div>
                            )}
                            {order.shippingInfo.shippingRequest && (
                                <div className="col-span-2">
                                    <span className="font-medium text-gray-500">배송 요청사항:</span> {order.shippingInfo.shippingRequest}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. 주문 상품 목록 테이블 */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">주문 상품 목록</h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-gray-100 text-gray-600 border-b">
                                    <tr>
                                        <th className="p-3">상품명 / 옵션</th>
                                        <th className="p-3 text-right">단가</th>
                                        <th className="p-3 text-center">수량</th>
                                        <th className="p-3 text-right">소계</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items?.map((item) => (
                                        <tr key={item.orderItemId || item.productId}>
                                            <td className="p-3">
                                                <div className="font-medium text-gray-900">{item.productName}</div>
                                                {item.optionName && (
                                                    <div className="text-gray-400 text-[11px]">옵션: {item.optionName}</div>
                                                )}
                                                <div className="text-gray-400 text-[10px] font-mono">SKU: {item.skuId}</div>
                                            </td>
                                            <td className="p-3 text-right text-gray-600">
                                                {item.price.toLocaleString()}원
                                            </td>
                                            <td className="p-3 text-center text-gray-700">{item.quantity}개</td>
                                            <td className="p-3 text-right font-medium text-gray-900">
                                                {(item.price * item.quantity).toLocaleString()}원
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 5. 최종 결제 금액 요약 (PRD 3.3 반영) */}
                    <div className="rounded-lg border bg-gray-50 p-4 space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between">
                            <span>총 상품금액</span>
                            <span>{order.totalProductAmount.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between">
                            <span>배송비</span>
                            <span>+{order.shippingFee.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                            <span>할인금액</span>
                            <span>-{order.discountAmount.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 text-sm font-bold text-gray-900">
                            <span>최종 결제 금액</span>
                            <span className="text-blue-600">{order.finalAmount.toLocaleString()}원</span>
                        </div>
                    </div>
                </div>

                {/* 하단 닫기 버튼 */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-300 transition"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}