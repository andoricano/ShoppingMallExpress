// components/order/OrderShippingAddress.tsx

"use client";

interface OrderShippingAddressProps {
    address?: string;
    onAddressChange?: (address: string) => void;
}

export function OrderShippingAddress({
    address = "",
    onAddressChange,
}: OrderShippingAddressProps) {
    const handleConfirmAddress = () => {
        const selectedAddress =
            "경기도 수원시 장안구 파장동";

        onAddressChange?.(selectedAddress);
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
                배송지
            </h2>

            <div className="mt-5">
                {address ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-900">
                            {address}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">
                        배송지를 입력해주세요.
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleConfirmAddress}
                    className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                    주소 입력
                </button>
            </div>
        </section>
    );
}