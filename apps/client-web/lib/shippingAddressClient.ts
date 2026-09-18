// lib/shippingAddressClient.ts

import type {
    ClientAddress,
    CreateClientAddressInput,
    UpdateClientAddressInput,
} from "@mall/types";

import { createClient } from "@/lib/supabase/client";

export const shippingAddressClient = {
    // ==========================================
    // 배송지 목록 조회
    // ==========================================

    async getMyAddresses(): Promise<ClientAddress[]> {
        const supabase = createClient();

        console.log(
            "[ShippingAddress] get_my_addresses 호출",
        );

        const {
            data,
            error,
        } = await supabase.rpc(
            "get_my_addresses",
        );

        console.log(
            "[ShippingAddress] get_my_addresses 결과:",
            {
                data,
                error,
                errorMessage: error?.message,
                errorCode: error?.code,
                errorDetails: error?.details,
                errorHint: error?.hint,
            },
        );

        if (error) {
            throw error;
        }

        return (data ?? []) as ClientAddress[];
    },

    // ==========================================
    // 배송지 추가
    // ==========================================

    async createAddress(
        input: CreateClientAddressInput,
    ): Promise<ClientAddress> {
        const supabase = createClient();

        const {
            data,
            error,
        } = await supabase.rpc(
            "create_my_address",
            {
                p_label:
                    input.label ?? null,

                p_recipient_name:
                    input.recipientName,

                p_phone:
                    input.phone,

                p_zonecode:
                    input.zonecode,

                p_address:
                    input.address,

                p_address_detail:
                    input.addressDetail ?? null,

                p_is_default:
                    input.isDefault ?? false,
            },
        );

        if (error) {
            throw error;
        }

        return data as ClientAddress;
    },

    // ==========================================
    // 배송지 수정
    // ==========================================

    async updateAddress(
        id: string,
        input: UpdateClientAddressInput,
    ): Promise<ClientAddress> {
        const supabase = createClient();

        const {
            data,
            error,
        } = await supabase.rpc(
            "update_my_address",
            {
                p_id: id,

                p_label:
                    input.label ?? null,

                p_recipient_name:
                    input.recipientName ??
                    null,

                p_phone:
                    input.phone ?? null,

                p_zonecode:
                    input.zonecode ?? null,

                p_address:
                    input.address ?? null,

                p_address_detail:
                    input.addressDetail ??
                    null,

                p_is_default:
                    input.isDefault ?? null,
            },
        );

        if (error) {
            throw error;
        }

        return data as ClientAddress;
    },

    // ==========================================
    // 배송지 삭제
    // ==========================================

    async deleteAddress(
        id: string,
    ): Promise<void> {
        const supabase = createClient();

        const {
            error,
        } = await supabase.rpc(
            "delete_my_address",
            {
                p_id: id,
            },
        );

        if (error) {
            throw error;
        }
    },

    // ==========================================
    // 기본 배송지 설정
    // ==========================================

    async setDefaultAddress(
        id: string,
    ): Promise<ClientAddress> {
        const supabase = createClient();

        const {
            data,
            error,
        } = await supabase.rpc(
            "set_my_default_address",
            {
                p_id: id,
            },
        );

        if (error) {
            throw error;
        }

        return data as ClientAddress;
    },
};