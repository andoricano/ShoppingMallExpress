"use client";

import { useOrderEditSection } from "@/hooks/history/useOrderEditSection";
import type {
    Order,
    OrderShippingAddress,
} from "@mall/types";
import OrderProductViewer from "./OrderProductViewer";
import OrderShippingAddressEditor from "./OrderShippingAddressEditor";
import { OrderShippingAddressCheckBox } from "@/components/order/order/OrderShippingAddressCheckBox";


interface OrderEditSectionProps {
    order: Order;

    loading?: boolean;

    onSubmit: (
        shippingAddress: OrderShippingAddress,
    ) => void;
}

export default function OrderEditSection({
    order,
    loading = false,
    onSubmit,
}: OrderEditSectionProps) {
    const {
        shippingAddress,
        handleAddressChange,
        handleAddressSelect,
    } = useOrderEditSection({
        initialAddress:
            order.shippingAddress,
    });

    const handleSubmit = () => {
        onSubmit(
            shippingAddress,
        );
    };

    return (
        <div className="space-y-5">
            {/* 주문 상품 */}
            <OrderProductViewer
                items={order.items}
            />

            {/* 배송지 */}
            <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
                <OrderShippingAddressEditor
                    address={
                        shippingAddress
                    }
                    onChange={
                        handleAddressChange
                    }
                />

                <OrderShippingAddressCheckBox
                    value={
                        shippingAddress.address
                    }
                    onChange={
                        handleAddressSelect
                    }
                />
            </section>

            {/* 최종 결제 금액 */}
            <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">
                        최종 결제 금액
                    </span>

                    <span className="text-xl font-bold text-slate-900">
                        {order.totalPrice.toLocaleString(
                            "ko-KR",
                        )}
                        원
                    </span>
                </div>

                <button
                    type="button"
                    onClick={
                        handleSubmit
                    }
                    disabled={loading}
                    className="mt-5 w-full rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "수정 중..."
                        : "주문 정보 수정"}
                </button>
            </section>
        </div>
    );
}