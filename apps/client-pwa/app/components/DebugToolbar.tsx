// app/components/debug/DebugToolbar.tsx

'use client';

import React from 'react';

interface DebugToolbarProps {
    children: React.ReactNode;
    position?: 'top' | 'bottom';
}

export default function DebugToolbar({
    children,
    position = 'top',
}: DebugToolbarProps) {
    return (
        <div
            className={[
                'flex items-center gap-2 px-4 py-2',
                'border-b',
                position === 'bottom' ? 'border-t border-b-0' : '',
            ].join(' ')}
        >
            {children}
        </div>
    );
}