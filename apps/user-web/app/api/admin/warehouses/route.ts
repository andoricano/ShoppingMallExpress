import { NextResponse } from "next/server";

import type { Warehouse } from "@mall/types";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type WarehouseRow = {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    is_active: boolean;
    meta: Record<string, unknown>;
    created_at: string;
    updated_at: string;
};

function toWarehouse(row: WarehouseRow): Warehouse {
    return {
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        isActive: row.is_active,
        meta: row.meta,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function GET() {
    try {
        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase
            .from("warehouses")
            .select("id, name, code, description, is_active, meta, created_at, updated_at")
            .order("name");

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: (data as WarehouseRow[]).map(toWarehouse),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
