interface InventoryActionButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: "default" | "active" | "danger";
    disabled?: boolean;
}

export const InventoryActionButton: React.FC<InventoryActionButtonProps> = ({
    onClick,
    children,
    variant = "default",
    disabled = false,
}) => {
    const variantClass =
        variant === "active"
            ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
            : variant === "danger"
                ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`px-2.5 py-1 text-xs font-medium border rounded-md transition-colors shadow-sm ${variantClass} disabled:opacity-50`}
        >
            {children}
        </button>
    );
};