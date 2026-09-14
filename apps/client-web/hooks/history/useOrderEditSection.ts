"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    OrderShippingAddress,
} from "@mall/types";

interface UseOrderEditSectionParams {
    initialAddress: OrderShippingAddress;
}

export function useOrderEditSection({
    initialAddress,
}: UseOrderEditSectionParams) {
    const [
        shippingAddress,
        setShippingAddress,
    ] = useState<OrderShippingAddress>(
        initialAddress,
    );

    // ==========================================
    // 배송지 전체 변경
    // ==========================================

    const handleAddressChange =
        useCallback(
            (
                address: OrderShippingAddress,
            ) => {
                setShippingAddress(
                    address,
                );
            },
            [],
        );

    // ==========================================
    // 개별 필드 변경
    // ==========================================

    const handleFieldChange =
        useCallback(
            (
                field: keyof OrderShippingAddress,
                value: string,
            ) => {
                setShippingAddress(
                    (current) => ({
                        ...current,
                        [field]: value,
                    }),
                );
            },
            [],
        );

    // ==========================================
    // 주소 선택
    //
    // 현재 CheckBox는 address 문자열만 반환하므로
    // 우선 address만 변경하도록 둡니다.
    // 이후 전체 배송지 객체를 받도록 확장합니다.
    // ==========================================

    const handleAddressSelect =
        useCallback(
            (address: string) => {
                setShippingAddress(
                    (current) => ({
                        ...current,
                        address,
                    }),
                );
            },
            [],
        );

    // ==========================================
    // 초기 주소로 복원
    // ==========================================

    const resetAddress =
        useCallback(() => {
            setShippingAddress(
                initialAddress,
            );
        }, [initialAddress]);

    return {
        shippingAddress,

        setShippingAddress,

        handleAddressChange,
        handleFieldChange,
        handleAddressSelect,

        resetAddress,
    };
}