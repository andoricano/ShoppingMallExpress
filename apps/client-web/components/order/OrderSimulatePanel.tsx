// components/order/OrderSimulatePanel.tsx
"use client";

import React, { useState } from "react";
// 모노레포 공통 정확한 주문 관련 타입 import
import type { Order, OrderStatus } from "@mall/types";

interface OrderSimulatePanelProps {
    /** 시뮬레이션 대상 주문 목록 */
    orders?: Order[];
    /** [PRD 3.5] 주문 상태 변경 시뮬레이션 핸들러 */
    onSimulateStatusChange?: (orderId: string, newStatus: OrderStatus) => Promise<void>;
    /** [PRD 3.4] PG 결제 웹훅/콜백 수신 모의 핸들러 */
    onSimulatePaymentWebhook?: (orderId: string, success: boolean) => Promise<void>;
    /** [PRD 3.4] 10분 재고 임시 점유 만료 시뮬레이션 핸들러 */
    onSimulateStockExpiration?: (orderId: string) => Promise<void>;
    /** 데이터 새로고침 핸들러 */
    onRefresh?: () => void;
}

export function OrderSimulatePanel({
    orders = [],
    onSimulateStatusChange,
    onSimulatePaymentWebhook,
    onSimulateStockExpiration,
    onRefresh,
}: OrderSimulatePanelProps) {
    // 1. 시뮬레이션 대상 주문 선택 상태
    const [selectedOrderId, setSelectedOrderId] = useState<string>(
        orders[0]?.orderId || ""
    );

    // 2. 변경할 주문 상태 선택 (수정: OrderStatus 4가지 값 기반)
    const [targetStatus, setTargetStatus] = useState<OrderStatus>("ORDER_RECEIVED");

    // 3. 로딩 및 실행 로그 상태
    const [isLoading, setIsLoading] = useState(false);
    const [simulationLogs, setSimulationLogs] = useState<
        Array<{ id: number; timestamp: string; type: "info" | "success" | "error"; message: string }>
    >([]);

    // 현재 선택된 주문 객체
    const currentOrder = orders.find((o) => o.orderId === selectedOrderId);

    // 로그 추가 헬퍼 함수
    const addLog = (type: "info" | "success" | "error", message: string) => {
        const timestamp = new Date().toLocaleTimeString("ko-KR");
        setSimulationLogs((prev) => [
            { id: Date.now(), timestamp, type, message },
            ...prev,
        ]);
    };

    // [PRD 3.5] 상태 강제 변경 실행
    const handleStatusChangeSubmit = async () => {
        if (!selectedOrderId) {
            addLog("error", "시뮬레이션을 진행할 주문을 선택해 주세요.");
            return;
        }

        setIsLoading(true);
        addLog("info", `주문 [${selectedOrderId}] 상태 변경 요청 -> ${targetStatus}`);

        try {
            if (onSimulateStatusChange) {
                await onSimulateStatusChange(selectedOrderId, targetStatus);
                addLog("success", `주문 [${selectedOrderId}] 상태가 ${targetStatus}(으)로 변경되었습니다.`);
            } else {
                addLog("success", `[MOCK] 주문 [${selectedOrderId}] 상태가 ${targetStatus}(으)로 반영되었습니다.`);
            }
            if (onRefresh) onRefresh();
        } catch {
            addLog("error", `주문 [${selectedOrderId}] 상태 변경 시뮬레이션 중 오류가 발생했습니다.`);
        } finally {
            setIsLoading(false);
        }
    };

    // [PRD 3.4] 결제 웹훅 수신 시뮬레이션
    const handlePaymentWebhookSubmit = async (success: boolean) => {
        if (!selectedOrderId) {
            addLog("error", "시뮬레이션을 진행할 주문을 선택해 주세요.");
            return;
        }

        setIsLoading(true);
        const eventName = success ? "결제 승인 (SUCCESS)" : "결제 실패 (FAIL)";
        addLog("info", `주문 [${selectedOrderId}] PG 웹훅 이벤트 전송 중 -> ${eventName}`);

        try {
            if (onSimulatePaymentWebhook) {
                await onSimulatePaymentWebhook(selectedOrderId, success);
                addLog("success", `주문 [${selectedOrderId}] ${eventName} 웹훅 수신 및 데이터 갱신 완료`);
            } else {
                addLog("success", `[MOCK] 주문 [${selectedOrderId}] ${eventName} 웹훅 처리 성공`);
            }
            if (onRefresh) onRefresh();
        } catch {
            addLog("error", `주문 [${selectedOrderId}] 웹훅 수신 처리 실패`);
        } finally {
            setIsLoading(false);
        }
    };

    // [PRD 3.4] 10분 재고 점유 만료(TTL Expiration) 시뮬레이션
    const handleStockExpirationSubmit = async () => {
        if (!selectedOrderId) {
            addLog("error", "시뮬레이션을 진행할 주문을 선택해 주세요.");
            return;
        }

        setIsLoading(true);
        addLog("info", `주문 [${selectedOrderId}] 10분 재고 임시 점유 만료(TTL Expired) 이벤트 발생`);

        try {
            if (onSimulateStockExpiration) {
                await onSimulateStockExpiration(selectedOrderId);
                addLog("success", `주문 [${selectedOrderId}] 재고 점유 해제 및 자동 CANCELLED 처리 완료`);
            } else {
                addLog("success", `[MOCK] 주문 [${selectedOrderId}] 재고 복구 및 자동 주문 취소 완료`);
            }
            if (onRefresh) onRefresh();
        } catch {
            addLog("error", `주문 [${selectedOrderId}] 재고 만료 처리 중 오류 발생`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌측: 시뮬레이션 제어 컨트롤 패널 */}
            <div className="space-y-6">
                {/* 1. 대상 주문 선택 */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-gray-800 border-b pb-3">
                        1. 시뮬레이션 대상 주문 선택
                    </h3>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            테스트 주문 지정
                        </label>
                        <select
                            value={selectedOrderId}
                            onChange={(e) => setSelectedOrderId(e.target.value)}
                            className="w-full p-2.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {orders.length === 0 ? (
                                <option value="">주문 데이터가 없습니다</option>
                            ) : (
                                orders.map((order) => (
                                    <option key={order.orderId} value={order.orderId}>
                                        {order.orderId} ({order.orderStatus} / {order.finalAmount.toLocaleString()}원)
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* 선택된 주문 요약 정보 */}
                    {currentOrder && (
                        <div className="p-3 bg-gray-50 border rounded-lg text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-500">현재 상태:</span>
                                <span className="font-bold text-blue-600">{currentOrder.orderStatus}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">수령인:</span>
                                <span>{currentOrder.shippingInfo?.recipientName ?? "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">결제 금액:</span>
                                <span className="font-semibold">{currentOrder.finalAmount.toLocaleString()}원</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. 결제 웹훅 및 재고 만료 이벤트 시뮬레이션 */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-gray-800 border-b pb-3">
                        2. 이벤트 및 웹훅 모의 발송
                    </h3>

                    <div className="space-y-3">
                        {/* 결제 웹훅 수신 시뮬레이션 */}
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-gray-600 block">
                                [PRD 3.4] PG 결제 웹훅 수신 테스트
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={isLoading || !selectedOrderId}
                                    onClick={() => handlePaymentWebhookSubmit(true)}
                                    className="py-2 px-3 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                                >
                                    ✅ 결제 승인 성공 웹훅
                                </button>
                                <button
                                    type="button"
                                    disabled={isLoading || !selectedOrderId}
                                    onClick={() => handlePaymentWebhookSubmit(false)}
                                    className="py-2 px-3 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
                                >
                                    ❌ 결제 실패 웹훅
                                </button>
                            </div>
                        </div>

                        {/* 10분 재고 점유 만료 테스트 */}
                        <div className="pt-2 border-t">
                            <span className="text-xs font-medium text-gray-600 block mb-2">
                                [PRD 3.4] 10분 미결제 재고 점유 만료(TTL)
                            </span>
                            <button
                                type="button"
                                disabled={isLoading || !selectedOrderId}
                                onClick={handleStockExpirationSubmit}
                                className="w-full py-2 px-3 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition disabled:opacity-50"
                            >
                                ⏳ 재고 점유 만료 및 자동 취소 강제 실행
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. 주문 상태 수동 강제 변경 */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-gray-800 border-b pb-3">
                        3. [PRD 3.5] 주문 상태 수동 트랜지션
                    </h3>

                    <div className="flex gap-2 text-xs">
                        {/* 수정: OrderStatus 값인 4가지 옵션 제공 */}
                        <select
                            value={targetStatus}
                            onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                        >
                            <option value="PAYMENT_PENDING">PAYMENT_PENDING (결제 대기)</option>
                            <option value="ORDER_RECEIVED">ORDER_RECEIVED (주문 접수)</option>
                            <option value="COMPLETED">COMPLETED (처리 완료)</option>
                            <option value="CANCELLED">CANCELLED (주문 취소)</option>
                        </select>

                        <button
                            type="button"
                            disabled={isLoading || !selectedOrderId}
                            onClick={handleStatusChangeSubmit}
                            className="py-2 px-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50 whitespace-nowrap"
                        >
                            상태 반영
                        </button>
                    </div>
                </div>
            </div>

            {/* 우측: 시뮬레이션 수행 실시간 로그 모니터링 */}
            <div className="bg-gray-900 text-gray-100 p-5 rounded-xl border border-gray-800 font-mono text-xs flex flex-col h-[520px] shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
                    <span className="font-bold text-gray-200">🖥️ 시뮬레이션 실시간 수행 로그</span>
                    <button
                        onClick={() => setSimulationLogs([])}
                        className="text-[10px] text-gray-400 hover:text-gray-200 transition"
                    >
                        로그 지우기
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {simulationLogs.length === 0 ? (
                        <div className="text-gray-500 text-center pt-20">
                            좌측 제어판에서 시뮬레이션 이벤트를 실행하면 로그가 표시됩니다.
                        </div>
                    ) : (
                        simulationLogs.map((log) => (
                            <div key={log.id} className="leading-relaxed border-b border-gray-800/50 pb-1.5">
                                <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                                <span
                                    className={
                                        log.type === "success"
                                            ? "text-emerald-400"
                                            : log.type === "error"
                                                ? "text-rose-400"
                                                : "text-sky-400"
                                    }
                                >
                                    {log.message}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}