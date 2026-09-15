"use client";

interface PaymentMethodItem {
    selectedItem: string;
    onClick: () => void;
}

interface PaymentMethodListProps {
    items: PaymentMethodItem[];
}

export default function PaymentMethodList({
    items,
}: PaymentMethodListProps) {
    return (
        <div className="space-y-3">
            {items.map((item) => (
                <button
                    key={item.selectedItem}
                    type="button"
                    onClick={item.onClick}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-4 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                    {item.selectedItem}
                </button>
            ))}
        </div>
    );
}