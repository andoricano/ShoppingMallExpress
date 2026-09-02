"use client";

import React from "react";
import { AdminMenu, type AdminMenuItem } from "./AdminMenu";

interface AdminHeaderProps {
    title: string;
    description?: string;
    menu?: AdminMenuItem[];
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
    title,
    description,
    menu,
}) => {
    return (
        <div className="mb-6">
            <div className="flex items-start justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {title}
                    </h1>

                    {description && (
                        <p className="mt-2 text-sm text-slate-500">
                            {description}
                        </p>
                    )}
                </div>

                {menu && <AdminMenu menu={menu} />}
            </div>
        </div>
    );
};