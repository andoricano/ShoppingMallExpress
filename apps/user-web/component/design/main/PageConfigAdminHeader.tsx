// components/design/main/PageConfigAdminHeader.tsx

"use client";

import React from "react";

import {
    AdminMenu,
    type AdminMenuItem,
} from "@/component/common/AdminMenu";

interface PageConfigAdminHeaderProps {
    title: string;
    description?: string;

    menu: AdminMenuItem[];

    canSave?: boolean;
    isDirty?: boolean;
}

export const PageConfigAdminHeader: React.FC<
    PageConfigAdminHeaderProps
> = ({
    title,
    description,
    menu,
    canSave = true,
    isDirty
}) => {
        return (
            <div className="mb-6">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {title}
                        </h1>
                        {isDirty && (
                            <span className="ml-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                편집 중
                            </span>
                        )}
                        {description && (
                            <p className="mt-2 text-sm text-slate-500">
                                {description}
                            </p>
                        )}

                        {!canSave && (
                            <p className="mt-2 text-sm font-medium text-amber-600">
                                데이터를 설정하셔야 저장이 가능합니다.
                            </p>
                        )}
                    </div>

                    <AdminMenu menu={menu} />
                </div>
            </div>
        );
    };