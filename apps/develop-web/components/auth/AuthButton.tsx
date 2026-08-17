// @/components/auth/AuthButton.tsx
"use client";

interface AuthButtonProps {
    label: string;
    onClick: () => void;
    variant?: "default" | "primary" | "danger";
}

export function AuthButton({ label, onClick, variant = "default" }: AuthButtonProps) {
    const variantStyles = {
        default: "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800",
        primary: "bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/30",
        danger: "bg-red-950/30 hover:bg-red-900/40 text-red-400 border-red-800/40",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors text-center truncate ${variantStyles[variant]}`}
        >
            {label}
        </button>
    );
}