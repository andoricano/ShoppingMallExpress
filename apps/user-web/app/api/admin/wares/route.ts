import { NextRequest, NextResponse } from "next/server";

import type { Ware } from "@mall/types";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type WareRow = {
    id: string;
    warehouse_id: string;
    ware_code: string | null;
    name: string;
    ware_type: string;
    current_stock: number;
    reserved_stock: number;
    is_active: boolean;
    meta: Record<string, unknown>;
    created_at: string;
    updated_at: string;
};

function toWare(row: WareRow): Ware {
    return {
        id: row.id,
        warehouseId: row.warehouse_id,
        wareCode: row.ware_code,
        name: row.name,
        wareType: row.ware_type,
        currentStock: row.current_stock,
        reservedStock: row.reserved_stock,
        isActive: row.is_active,
        meta: row.meta,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await requireAdminServiceClient();
        const search = request.nextUrl.searchParams.get("search")?.trim();
        const isActive = request.nextUrl.searchParams.get("isActive");

        let query = supabase
            .from("wares")
            .select("id, warehouse_id, ware_code, name, ware_type, current_stock, reserved_stock, is_active, meta, created_at, updated_at")
            .order("created_at", { ascending: false });

        if (search) {
            query = query.or(
                `name.ilike.%${search}%,ware_code.ilike.%${search}%`,
            );
        }

        if (isActive === "true" || isActive === "false") {
            query = query.eq("is_active", isActive === "true");
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: (data as WareRow[]).map(toWare),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as {
            warehouseId?: string;
            name?: string;
            wareCode?: string;
            wareType?: string;
            currentStock?: number;
            meta?: Record<string, unknown>;
        };

        if (!body.warehouseId || !body.name?.trim()) {
            return NextResponse.json(
                { message: "warehouseId and name are required." },
                { status: 400 },
            );
        }

        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase.rpc("create_ware", {
            p_warehouse_id: body.warehouseId,
            p_name: body.name,
            p_ware_code: body.wareCode ?? null,
            p_ware_type: body.wareType ?? "GENERAL",
            p_current_stock: body.currentStock ?? 0,
            p_meta: body.meta ?? {},
        });

        if (error) {
            throw error;
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
