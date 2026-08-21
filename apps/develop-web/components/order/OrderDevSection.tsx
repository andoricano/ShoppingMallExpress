// apps/develop-web/components/order/OrderDevSection.tsx
"use client";

import React from "react";
import { OrderOverviewPanel } from "./OrderOverviewPanel";
import { OrderCheckoutPanel } from "./OrderCheckoutPanel";
import { OrderCartWishlistPanel } from "./OrderCartWishlistPanel";
import { OrderSimulatePanel } from "./OrderSimulatePanel";
import { OrderDetailModal } from "./OrderDetailModal";
import { useOrderDev } from "./useOrderDev";
import { OrderAuditLogPanel } from "./OrderAuditLogPanel";


export function OrderDevSection() {
    // [수정] useOrderDev 훅을 호출하여 상태 및 핸들러 가져오기
    const {
        activeTab,
        setActiveTab,
        orders,
        cartItems,
        wishlistItems,
        auditLogs,
        selectedOrderId,
        setSelectedOrderId,
        handlePrepareCheckout,
        handleCreateOrder,
        handleUpdateOrderStatus,
        handleSimulatePaymentWebhook,
        handleSimulateStockExpiration,
        handleUpdateCartQuantity,
        handleToggleCartCheck,
        handleRemoveCartItem,
        handleClearCart,
        handleMoveWishlistToCart,
        handleRemoveWishlistItem,
    } = useOrderDev();

    // [수정] 현재 선택된 주문 아이디로 모달에 전달할 주문 데이터 찾기
    const selectedOrder = orders.find((o) => o.orderId === selectedOrderId) || null;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* [수정] 탭 전환 네비게이션 영역 */}
            <div className="flex border-b border-gray-200 gap-2 bg-gray-50/50 p-1.5 rounded-xl border">
                {[
                    { id: "overview", label: "📊 주문 현황 대시보드" },
                    { id: "checkout", label: "💳 주문서 생성/계산 (3.3/3.4)" },
                    { id: "cart", label: "🛒 장바구니/위시리스트 (3.1/3.2)" },
                    { id: "simulate", label: "⚙️ 결제/재고 시뮬레이터 (3.4/3.5)" },
                    { id: "audit", label: "📜 감사 로그" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === tab.id
                            ? "bg-white text-blue-600 shadow-sm border border-gray-200/80"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* [수정] activeTab에 따라 작성해둔 하위 패널 렌더링 */}
            <div className="mt-4">
                {activeTab === "overview" && (
                    <OrderOverviewPanel
                        orders={orders}
                        onSelectOrder={(orderId) => setSelectedOrderId(orderId)}
                    />
                )}

                {activeTab === "checkout" && (
                    <OrderCheckoutPanel
                        onPrepareCheckout={handlePrepareCheckout}
                        onCreateOrder={handleCreateOrder}
                    />
                )}

                {activeTab === "cart" && (
                    <OrderCartWishlistPanel
                        cartItems={cartItems}
                        wishlistItems={wishlistItems}
                        onUpdateCartQuantity={handleUpdateCartQuantity}
                        onToggleCartCheck={handleToggleCartCheck}
                        onRemoveCartItem={handleRemoveCartItem}
                        onClearCart={handleClearCart}
                        onMoveWishlistToCart={handleMoveWishlistToCart}
                        onRemoveWishlistItem={handleRemoveWishlistItem}
                    />
                )}

                {activeTab === "simulate" && (
                    <OrderSimulatePanel
                        orders={orders}
                        onSimulateStatusChange={async (id, status) => handleUpdateOrderStatus(id, status)}
                        onSimulatePaymentWebhook={handleSimulatePaymentWebhook}
                        onSimulateStockExpiration={handleSimulateStockExpiration}
                    />
                )}

                {activeTab === "audit" && <OrderAuditLogPanel logs={auditLogs} />}
            </div>

            {/* [수정] 주문 클릭 시 오픈되는 상세 모달 */}
            {selectedOrderId && (
                <OrderDetailModal
                    isOpen={!!selectedOrderId} // selectedOrderId가 존재하면 true 전달
                    order={selectedOrder}
                    onClose={() => setSelectedOrderId(null)}
                />
            )}
        </div>
    );
}