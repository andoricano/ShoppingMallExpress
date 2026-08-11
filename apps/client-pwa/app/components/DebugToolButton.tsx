// app/components/debug/DebugToolButton.tsx

'use client';

import React from 'react';

interface DebugToolButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}

export default function DebugToolButton({
    children,
    onClick,
    disabled = false,
}: DebugToolButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="rounded border px-3 py-1 text-xs"
        >
            {children}
        </button>
    );
}