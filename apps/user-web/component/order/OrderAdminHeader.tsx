"use client";

import React from "react";

export const OrderAdminHeader: React.FC = () => {
    return (
        <div className="mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    주문 관리
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    전체 주문을 확인하고 관리하세요.
                </p>
            </div>
        </div>
    );
};