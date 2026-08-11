// app/components/debug/DebugPanel.tsx

'use client';

import React, { useMemo } from 'react';
import { DebugLine } from './DebugType';


interface DebugPanelProps {
    lines: DebugLine[];
    maxLength?: number;
}

export default function DebugPanel({
    lines,
    maxLength = 10000,
}: DebugPanelProps) {
    const visibleLines = useMemo(() => {
        let length = 0;
        const result: DebugLine[] = [];

        // 최신 로그부터 유지
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];

            if (!line) {
                continue;
            }

            const lineLength = line.text.length + 1;

            if (length + lineLength > maxLength) {
                break;
            }

            result.unshift(line);
            length += lineLength;
        }

        return result;
    }, [lines, maxLength]);

    return (
        <div className="flex-1 overflow-y-auto bg-black p-3 font-mono text-xs">
            {visibleLines.map((line, index) => (
                <div
                    key={`${index}-${line.text}`}
                    style={{
                        color: line.color ?? '#ffffff',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}
                >
                    {line.text}
                </div>
            ))}
        </div>
    );
}