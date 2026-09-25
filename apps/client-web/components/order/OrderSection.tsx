"use client";

import Link from "next/link";

import { LOGIN_REQUIRED_MESSAGE } from "@/hooks/user/useCart";
import {
    useOrderSection,
    type OrderShippingForm,
} from "@/hooks/order/useOrderSection";

interface OrderSectionProps {
    onOrderCreated: (orderId: string) => void;
}

const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

const SHIPPING_FIELDS: {
    key: keyof OrderShippingForm;
    label: string;
    required: boolean;
}[] = [
    { key: "recipientName", label: "수령인", required: true },
    { key: "phone", label: "연락처", required: true },
    { key: "zonecode", label: "우편번호", required: true },
    { key: "address", label: "주소", required: true },
    { key: "addressDetail", label: "상세 주소", required: false },
];

/**
 * Orders the whole server Cart through create_order_from_cart(). Prices shown
 * here are estimates; the created Order uses server-side snapshots.
 */
export function OrderSection({
    onOrderCreated,
}: OrderSectionProps) {
    const {
        cart,
        addresses,
        selectedAddressId,
        selectAddress,
        shipping,
        updateShipping,
        estimatedTotal,
        unavailableItems,
        creating,
        canSubmit,
        orderError,
        submitOrder,
    } = useOrderSection();

    const handleSubmit = async () => {
        const orderId = await submitOrder();

        if (orderId) {
            onOrderCreated(orderId);
        }
    };

    if (!cart.cart && cart.loading) {
        return <main className="min-h-screen p-6">주문 정보를 불러오는 중...</main>;
    }

    if (!cart.cart && cart.error === LOGIN_REQUIRED_MESSAGE) {
        return (
            <main className="min-h-screen p-6">
                <p className="text-sm text-slate-600">주문은 로그인 후 이용할 수 있습니다.</p>
                <Link href="/auth" className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                    로그인
                </Link>
            </main>
        );
    }

    if (!cart.cart && cart.error) {
        return <main className="min-h-screen p-6 text-red-600">{cart.error}</main>;
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8 sm:px-6 2xl:max-w-6xl">
                <h1 className="text-2xl font-bold text-slate-900">주문하기</h1>

                {/* 주문 상품 (장바구니 전체) */}
                <section className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">주문 상품</h2>
                        <Link href="/cart" className="text-sm text-slate-500 underline">
                            장바구니 수정
                        </Link>
                    </div>

                    {cart.items.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">장바구니가 비어 있습니다.</p>
                    ) : (
                        <ul className="mt-4 divide-y divide-slate-100">
                            {cart.items.map((item) => (
                                <li key={item.id} className="flex items-center gap-4 py-3">
                                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                        {item.imageUrl && (
                                            <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-900">{item.productName}</p>
                                        <p className="text-xs text-slate-500">
                                            {[item.variantLabel, `${item.quantity}개`].filter(Boolean).join(" · ")}
                                        </p>
                                        {!item.isAvailable && (
                                            <p className="text-xs font-semibold text-rose-600">
                                                {item.stockStatus === "OUT_OF_STOCK" ? "품절" : "판매 중지"}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {(item.price * item.quantity).toLocaleString("ko-KR")}원
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* 배송지 */}
                <section className="rounded-xl border border-slate-200 bg-white p-6">
                    <h2 className="text-lg font-semibold text-slate-900">배송지</h2>

                    {addresses.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {addresses.map((address) => (
                                <button
                                    key={address.id}
                                    type="button"
                                    onClick={() => selectAddress(address.id)}
                                    className={[
                                        "rounded-lg border px-3 py-2 text-left text-xs",
                                        selectedAddressId === address.id
                                            ? "border-slate-900 bg-slate-50"
                                            : "border-slate-200",
                                    ].join(" ")}
                                >
                                    <span className="font-semibold">{address.label ?? address.recipientName}</span>
                                    {address.isDefault && <span className="ml-1 text-blue-600">기본</span>}
                                    <span className="block text-slate-500">{address.address}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => selectAddress(null)}
                                className={[
                                    "rounded-lg border px-3 py-2 text-xs",
                                    selectedAddressId === null ? "border-slate-900 bg-slate-50" : "border-slate-200",
                                ].join(" ")}
                            >
                                직접 입력
                            </button>
                        </div>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {SHIPPING_FIELDS.map((field) => (
                            <label key={field.key} className="text-xs text-slate-600">
                                {field.label}
                                {field.required && <span className="text-rose-500"> *</span>}
                                <input
                                    value={shipping[field.key]}
                                    onChange={(event) => updateShipping({ [field.key]: event.target.value })}
                                    className={`${inputClass} mt-1`}
                                />
                            </label>
                        ))}
                    </div>
                </section>

                {/* 결제 금액 */}
                <section className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">예상 주문 금액</span>
                        <span className="text-2xl font-bold text-slate-900">
                            {estimatedTotal.toLocaleString("ko-KR")}원
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        최종 금액은 주문 시점의 상품 가격으로 확정됩니다.
                    </p>

                    {unavailableItems.length > 0 && (
                        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            품절 또는 판매 중지된 상품이 있습니다. 장바구니에서 삭제한 뒤 주문해 주세요.
                        </p>
                    )}

                    {orderError && (
                        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                            {orderError}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {creating ? "주문 생성 중..." : "주문하기"}
                    </button>
                </section>
            </div>
        </main>
    );
}
