"use client";

interface OrderButtonProps {
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
}

export function OrderButton({
    disabled = false,
    loading = false,
    onClick,
}: OrderButtonProps) {
    return (
        <button
            type="button"
            disabled={
                disabled ||
                loading
            }
            onClick={onClick}
            className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
            {loading
                ? "처리 중..."
                : "주문하기"}
        </button>
    );
}