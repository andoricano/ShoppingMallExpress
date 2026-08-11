// app/components/debug/DebugInput.tsx

'use client';

import React, { useState } from 'react';

interface DebugInputProps {
    onSubmit: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function DebugInput({
    onSubmit,
    placeholder = '명령어를 입력하세요...',
    disabled = false,
}: DebugInputProps) {
    const [value, setValue] = useState('');

    const handleSubmit = () => {
        const text = value.trim();

        if (!text) {
            return;
        }

        onSubmit(text);
        setValue('');
    };

    return (
        <div className="flex items-center gap-2 border-t px-3 py-2">
            <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleSubmit();
                    }
                }}
                placeholder={placeholder}
                disabled={disabled}
                className="min-w-0 flex-1 rounded border px-3 py-2 text-sm outline-none"
            />

            <button
                type="button"
                onClick={handleSubmit}
                disabled={disabled}
                className="rounded border px-4 py-2 text-sm"
            >
                Send
            </button>
        </div>
    );
}