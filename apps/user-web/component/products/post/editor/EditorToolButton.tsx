// post/editor/EditorToolButton.tsx

"use client";

import type { ReactNode } from "react";

interface EditorToolButtonProps {
    text?: string;
    icon?: ReactNode;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
}

export function EditorToolButton({
    text,
    icon,
    onClick,
    active = false,
    disabled = false,
}: EditorToolButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={[
                "flex h-8 min-w-8 items-center justify-center rounded-md px-2",
                "text-sm transition-colors",
                active
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                disabled
                    ? "cursor-not-allowed opacity-40"
                    : "",
            ].join(" ")}
        >
            {icon ?? text}
        </button>
    );
}