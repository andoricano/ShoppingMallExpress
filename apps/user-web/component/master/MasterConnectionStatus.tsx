"use client";

import type { ConnectionStatus } from "@/hooks/useMasterConfig";

interface MasterConnectionStatusProps {
    status: ConnectionStatus;
}

export function MasterConnectionStatus({
    status,
}: MasterConnectionStatusProps) {
    const statusConfig = {
        checking: {
            label: "확인 중",
            className:
                "text-slate-600 bg-slate-50 border-slate-200",
        },
        connected: {
            label: "연결됨",
            className:
                "text-emerald-700 bg-emerald-50 border-emerald-200",
        },
        disconnected: {
            label: "연결 안 됨",
            className:
                "text-rose-700 bg-rose-50 border-rose-200",
        },
        unknown: {
            label: "확인 불가",
            className:
                "text-amber-700 bg-amber-50 border-amber-200",
        },
    };

    const current = statusConfig[status];

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div>
                <p className="text-sm font-semibold text-slate-800">
                    Cloudinary 연결 상태
                </p>

                <p className="mt-1 text-sm text-slate-500">
                    Cloudinary API 연결 상태를 확인합니다.
                </p>
            </div>

            <span
                className={`px-3 py-1.5 text-sm font-semibold border rounded-lg ${current.className}`}
            >
                {current.label}
            </span>
        </div>
    );
}