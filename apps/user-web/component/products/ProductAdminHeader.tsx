"use client";

import React from "react";
import { AdminMenu, type AdminMenuItem } from "../common/AdminMenu";

interface ProductAdminHeaderProps {
    menu: AdminMenuItem[];
}

export const ProductAdminHeader: React.FC<ProductAdminHeaderProps> = ({
    menu,
}) => {
    return (
        <div className="mb-6">
            <div className="flex items-start justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        상품 관리
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        상품 정보를 관리하고 판매 상태를 설정합니다.
                    </p>
                </div>

                <AdminMenu menu={menu} />
            </div>
        </div>
    );
};