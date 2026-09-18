"use client";

interface ProductQuantitySelectorProps {
    quantity: number;
    onChange: (quantity: number) => void;
    min?: number;
    max?: number;
}

export function ProductQuantitySelector({
    quantity,
    onChange,
    min = 1,
    max,
}: ProductQuantitySelectorProps) {
    const handleDecrease = () => {
        onChange(
            Math.max(min, quantity - 1),
        );
    };

    const handleIncrease = () => {
        if (
            max !== undefined &&
            quantity >= max
        ) {
            return;
        }

        onChange(quantity + 1);
    };

    return (
        <div>
            <label className="text-sm font-semibold text-slate-700">
                수량
            </label>

            <div className="mt-2 flex items-center">
                <button
                    type="button"
                    onClick={
                        handleDecrease
                    }
                    disabled={
                        quantity <= min
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-l-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    −
                </button>

                <div className="flex h-10 min-w-14 items-center justify-center border-y border-slate-200 text-sm font-semibold">
                    {quantity}
                </div>

                <button
                    type="button"
                    onClick={
                        handleIncrease
                    }
                    disabled={
                        max !== undefined &&
                        quantity >= max
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-slate-200 bg-white text-lg text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    +
                </button>
            </div>
        </div>
    );
}