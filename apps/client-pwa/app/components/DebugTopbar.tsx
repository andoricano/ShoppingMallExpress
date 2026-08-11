// app/components/debug/DebugTopbar.tsx

'use client';

import React from 'react';

interface DebugTopbarProps {
    title?: string;
    status?: 'idle' | 'running' | 'success' | 'error';
}

export default function DebugTopbar({
    title = 'Debug Console',
    status = 'idle',
}: DebugTopbarProps) {
    const statusText = {
        idle: 'IDLE',
        running: 'RUNNING',
        success: 'SUCCESS',
        error: 'ERROR',
    }[status];

    return (
        <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="font-mono text-sm font-semibold">
                {title}
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
                <span
                    className={`h-2 w-2 rounded-full ${status === 'idle'
                            ? 'bg-gray-400'
                            : status === 'running'
                                ? 'bg-yellow-400'
                                : status === 'success'
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                        }`}
                />

                <span>{statusText}</span>
            </div>
        </div>
    );
}