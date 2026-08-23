// components/order/OrderOverviewPanel.tsx
"use client";

import React, { useState, useMemo } from "react";
// 모노레포 공통 정확한 주문 관련 타입 import
import type { Order, OrderStatus } from "@mall/types";

interface OrderOverviewPanelProps {
    /** 전체 주문 목록 데이터 */
    orders?: Order[];
    /** 상세 주문 선택 핸들러 */
    onSelectOrder?: (orderId: string) => void;
    /** 주문 데이터 새로고침 핸들러 */
    onRefresh?: () => void;
}

export function OrderOverviewPanel({
    orders = [],
    onSelectOrder,
    onRefresh,
}: OrderOverviewPanelProps) {
    // 1. 주문 상태별 검색/필터링 상태 관리 (수정: 실제 OrderStatus 타입 값으로 정확히 제한)
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "ALL">("ALL");
    const [searchKeyword, setSearchKeyword] = useState<string>("");

    // 2. 상태별 주문 건수 통계 계산 (수정: OrderStatus 4가지 값만 카운트하도록 수정)
    const stats = useMemo(() => {
        const counts: Record<OrderStatus | "ALL", number> = {
            ALL: orders.length,
            PAYMENT_PENDING: 0,
            ORDER_RECEIVED: 0,
            COMPLETED: 0,
            CANCELLED: 0,
        };

        orders.forEach((order) => {
            if (counts[order.orderStatus] !== undefined) {
                counts[order.orderStatus]++;
            }
        });

        return counts;
    }, [orders]);

    // 3. 상태 필터 및 검색어 기반 주문 목록 필터링 (수정: OrderStatus 동일 일치 비교로 수정)
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            // 상태 필터링
            if (selectedStatus !== "ALL" && order.orderStatus !== selectedStatus) {
                return false;
            }

            // 검색어 필터링 (주문번호 및 수령인)
            if (searchKeyword.trim() !== "") {
                const keyword = searchKeyword.toLowerCase();
                const matchOrderId = order.orderId?.toLowerCase().includes(keyword);
                const matchRecipient = order.shippingInfo?.recipientName?.toLowerCase().includes(keyword);
                return matchOrderId || matchRecipient;
            }

            return true;
        });
    }, [orders, selectedStatus, searchKeyword]);

    // 주문 상태 뱃지 스타일 헬퍼 함수 (수정: OrderStatus 4가지 케이스만 정확히 분기)
    const getStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case "PAYMENT_PENDING":
                return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-100 text-amber-800">결제 대기</span>;
            case "ORDER_RECEIVED":
                return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-100 text-blue-800">주문 접수</span>;
            case "COMPLETED":
                return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-100 text-emerald-800">처리 완료</span>;
            case "CANCELLED":
                return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-100 text-rose-800">주문 취소</span>;
            default:
                return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. 상단 대시보드 요약 카운터 (수정: 실제 OrderStatus 4종류 탭으로 구성) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { id: "ALL", label: "전체 주문", count: stats.ALL, color: "border-gray-300 text-gray-800" },
                    { id: "PAYMENT_PENDING", label: "결제 대기", count: stats.PAYMENT_PENDING, color: "border-amber-300 text-amber-700" },
                    { id: "ORDER_RECEIVED", label: "주문 접수", count: stats.ORDER_RECEIVED, color: "border-blue-300 text-blue-700" },
                    { id: "COMPLETED", label: "처리 완료", count: stats.COMPLETED, color: "border-emerald-300 text-emerald-700" },
                    { id: "CANCELLED", label: "주문 취소", count: stats.CANCELLED, color: "border-rose-300 text-rose-700" },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setSelectedStatus(item.id as OrderStatus | "ALL")}
                        className={`p-3 bg-white rounded-xl border transition text-left shadow-sm hover:shadow-md ${selectedStatus === item.id ? "ring-2 ring-blue-500 border-transparent bg-blue-50/20" : item.color
                            }`}
                    >
                        <div className="text-[11px] font-semibold text-gray-500">{item.label}</div>
                        <div className="text-lg font-bold mt-1">{item.count}건</div>
                    </button>
                ))}
            </div>

            {/* 2. 검색 및 컨트롤 영역 */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="주문번호 또는 수령인 검색..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="w-full sm:w-64 p-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchKeyword && (
                        <button
                            onClick={() => setSearchKeyword("")}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800"
                        >
                            초기화
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                            🔄 새로고침
                        </button>
                    )}
                </div>
            </div>

            {/* 3. 최근 주문 목록 테이블 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-800">
                        주문 목록 ({filteredOrders.length}건)
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                            <tr>
                                <th className="p-3.5">주문번호 / 일시</th>
                                <th className="p-3.5">주문 상품 정보</th>
                                <th className="p-3.5">수령인 / 배송지</th>
                                <th className="p-3.5 text-right">최종 결제 금액</th>
                                <th className="p-3.5 text-center">주문 상태</th>
                                <th className="p-3.5 text-center">상세 보기</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">
                                        조건에 해당하는 주문 내역이 존재하지 않습니다.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const firstItemName = order.items?.[0]?.productName || order.items?.[0]?.productId || "상품 정보";
                                    const itemSummary = order.items && order.items.length > 1
                                        ? `${firstItemName} 외 ${order.items.length - 1}건`
                                        : firstItemName;

                                    return (
                                        <tr key={order.orderId} className="hover:bg-gray-50/80 transition">
                                            {/* 주문 ID 및 날짜 */}
                                            <td className="p-3.5 font-mono">
                                                <div className="font-semibold text-gray-900">{order.orderId}</div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleString("ko-KR") : "-"}
                                                </div>
                                            </td>

                                            {/* 주문 상품 요약 */}
                                            <td className="p-3.5">
                                                <div className="font-medium text-gray-800">{itemSummary}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                    총 {order.items?.reduce((acc, cur) => acc + cur.quantity, 0) ?? 0}개
                                                </div>
                                            </td>

                                            {/* 배송지 정보 */}
                                            <td className="p-3.5">
                                                <div className="font-medium text-gray-800">
                                                    {order.shippingInfo?.recipientName ?? "-"}
                                                </div>
                                                <div className="text-[10px] text-gray-400 truncate max-w-[180px]">
                                                    {order.shippingInfo?.isPickup
                                                        ? `[매장 픽업] ${order.shippingInfo.pickupLocation || ""}`
                                                        : order.shippingInfo?.shippingAddress || "-"}
                                                </div>
                                            </td>

                                            {/* 금액 (수정: Order 인터페이스의 finalAmount 속성 바인딩) */}
                                            <td className="p-3.5 text-right font-bold text-gray-900">
                                                {order.finalAmount.toLocaleString()}원
                                            </td>

                                            {/* 상태 뱃지 (수정: order.orderStatus 바인딩) */}
                                            <td className="p-3.5 text-center">
                                                {getStatusBadge(order.orderStatus)}
                                            </td>

                                            {/* 상세보기 액션 */}
                                            <td className="p-3.5 text-center">
                                                <button
                                                    onClick={() => onSelectOrder && onSelectOrder(order.orderId)}
                                                    className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 border border-blue-200 bg-blue-50 rounded hover:bg-blue-100 transition"
                                                >
                                                    상세보기
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}