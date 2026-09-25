import { NextRequest, NextResponse } from "next/server";

import type { Warehouse } from "@mall/types";

import {
    AdminBadRequestError,
    adminErrorResponse,
} from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

const WAREHOUSE_COLUMNS =
    "id, name, code, description, is_active, meta, created_at, updated_at";

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
            .select(WAREHOUSE_COLUMNS)
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

/**
 * Creates a Warehouse through the existing service-role-only
 * create_warehouse() RPC. Duplicate name/code surface as a unique violation
 * (409) through adminErrorResponse().
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await requireAdminServiceClient();
        const body = await request.json().catch(() => null) as {
            name?: unknown;
            code?: unknown;
            description?: unknown;
        } | null;

        if (typeof body?.name !== "string" || body.name.trim() === "") {
            throw new AdminBadRequestError("name is required.");
        }

        if (body.code !== undefined && body.code !== null && typeof body.code !== "string") {
            throw new AdminBadRequestError("code must be a string.");
        }

        if (
            body.description !== undefined
            && body.description !== null
            && typeof body.description !== "string"
        ) {
            throw new AdminBadRequestError("description must be a string.");
        }

        const { data: warehouseId, error } = await supabase.rpc(
            "create_warehouse",
            {
                p_name: body.name,
                p_code: body.code ?? null,
                p_description: body.description?.trim() || null,
                p_meta: {},
            },
        );

        if (error) {
            throw error;
        }

        const { data: warehouse, error: readError } = await supabase
            .from("warehouses")
            .select(WAREHOUSE_COLUMNS)
            .eq("id", warehouseId as string)
            .single();

        if (readError) {
            throw readError;
        }

        return NextResponse.json(
            { data: toWarehouse(warehouse as WarehouseRow) },
            { status: 201 },
        );
    } catch (error) {
        return adminErrorResponse(error);
    }
}
