import { NextResponse } from "next/server";

import type { UserProfile } from "@mall/types";

import { adminErrorResponse } from "@/lib/api/admin-response";
import { requireAdminServiceClient } from "@/lib/supabase/admin";

type ProfileRow = {
    id: string;
    name: string | null;
    role: UserProfile["role"];
    recipient_name: string | null;
    phone: string | null;
    is_onboarded: boolean;
    department: string | null;
    created_at: string;
    updated_at: string;
};

function toProfile(row: ProfileRow): UserProfile {
    if (row.role === "ADMIN") {
        return {
            id: row.id,
            name: row.name ?? undefined,
            role: "ADMIN",
            department: row.department ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    return {
        id: row.id,
        name: row.name ?? undefined,
        role: "CLIENT",
        recipientName: row.recipient_name ?? undefined,
        phone: row.phone ?? undefined,
        isOnboarded: row.is_onboarded,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function GET() {
    try {
        const supabase = await requireAdminServiceClient();
        const { data, error } = await supabase
            .from("user_profiles")
            .select("id, name, role, recipient_name, phone, is_onboarded, department, created_at, updated_at")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        return NextResponse.json({
            data: (data as ProfileRow[]).map(toProfile),
        });
    } catch (error) {
        return adminErrorResponse(error);
    }
}
