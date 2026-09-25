// lib/shippingAddressClient.ts

import type {
    ClientAddress,
    CreateClientAddressInput,
    UpdateClientAddressInput,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";

/**
 * ClientAddress CRUD through direct Supabase + RLS on `client_addresses`
 * (owner select/insert/update/delete, `client_id = auth.uid()`). The single
 * default address is maintained by the `client_addresses_clear_previous_default`
 * trigger and the `client_addresses_one_default_uidx` unique index.
 */

type ClientAddressRow = {
    id: string;
    client_id: string;
    label: string | null;
    recipient_name: string;
    phone: string;
    zonecode: string;
    address: string;
    address_detail: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
};

const ADDRESS_COLUMNS =
    "id, client_id, label, recipient_name, phone, zonecode, address, address_detail, is_default, created_at, updated_at";

function toClientAddress(row: ClientAddressRow): ClientAddress {
    return {
        id: row.id,
        clientId: row.client_id,
        label: row.label,
        recipientName: row.recipient_name,
        phone: row.phone,
        zonecode: row.zonecode,
        address: row.address,
        addressDetail: row.address_detail,
        isDefault: row.is_default,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

/** Blank optional text is stored as null (label must not be blank). */
function optionalText(value: string | null | undefined) {
    const text = value?.trim();

    return text ? text : null;
}

function toRowPatch(input: UpdateClientAddressInput) {
    const patch: Partial<ClientAddressRow> = {};

    if (input.label !== undefined) patch.label = optionalText(input.label);
    if (input.recipientName !== undefined) patch.recipient_name = input.recipientName.trim();
    if (input.phone !== undefined) patch.phone = input.phone.trim();
    if (input.zonecode !== undefined) patch.zonecode = input.zonecode.trim();
    if (input.address !== undefined) patch.address = input.address.trim();
    if (input.addressDetail !== undefined) patch.address_detail = optionalText(input.addressDetail);
    if (input.isDefault !== undefined) patch.is_default = input.isDefault;

    return patch;
}

async function requireUserId() {
    const {
        data: { session },
    } = await createClient().auth.getSession();

    if (!session) {
        throw new Error("로그인이 필요합니다.");
    }

    return session.user.id;
}

function toAddressError(error: { code?: string; message?: string }, fallback: string) {
    if (error.code === "23514") {
        return new Error("받는 분, 연락처, 우편번호, 주소를 입력해 주세요.");
    }

    return new Error(fallback);
}

export const shippingAddressClient = {
    // 배송지 목록 조회 (기본 배송지 우선)
    async getMyAddresses(): Promise<ClientAddress[]> {
        await requireUserId();

        const { data, error } = await createClient()
            .from("client_addresses")
            .select(ADDRESS_COLUMNS)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: true });

        if (error) {
            throw toAddressError(error, "배송지를 불러오지 못했습니다.");
        }

        return (data as ClientAddressRow[]).map(toClientAddress);
    },

    // 배송지 추가
    async createAddress(
        input: CreateClientAddressInput,
    ): Promise<ClientAddress> {
        const clientId = await requireUserId();

        const { data, error } = await createClient()
            .from("client_addresses")
            .insert({
                ...toRowPatch(input),
                client_id: clientId,
                is_default: input.isDefault ?? false,
            })
            .select(ADDRESS_COLUMNS)
            .single();

        if (error) {
            throw toAddressError(error, "배송지를 추가하지 못했습니다.");
        }

        return toClientAddress(data as ClientAddressRow);
    },

    // 배송지 수정
    async updateAddress(
        id: string,
        input: UpdateClientAddressInput,
    ): Promise<ClientAddress> {
        await requireUserId();

        const { data, error } = await createClient()
            .from("client_addresses")
            .update(toRowPatch(input))
            .eq("id", id)
            .select(ADDRESS_COLUMNS)
            .maybeSingle();

        if (error) {
            throw toAddressError(error, "배송지를 수정하지 못했습니다.");
        }

        if (!data) {
            throw new Error("배송지를 찾을 수 없습니다.");
        }

        return toClientAddress(data as ClientAddressRow);
    },

    // 배송지 삭제
    async deleteAddress(
        id: string,
    ): Promise<void> {
        await requireUserId();

        const { data, error } = await createClient()
            .from("client_addresses")
            .delete()
            .eq("id", id)
            .select("id");

        if (error) {
            throw toAddressError(error, "배송지를 삭제하지 못했습니다.");
        }

        if (!data || data.length === 0) {
            throw new Error("배송지를 찾을 수 없습니다.");
        }
    },

    // 기본 배송지 설정 (이전 기본값은 trigger가 해제)
    async setDefaultAddress(
        id: string,
    ): Promise<ClientAddress> {
        return this.updateAddress(id, { isDefault: true });
    },
};
