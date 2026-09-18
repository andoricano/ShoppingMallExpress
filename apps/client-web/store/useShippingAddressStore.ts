"use client";

import { create } from "zustand";

import type {
    ClientAddress,
    CreateClientAddressInput,
    UpdateClientAddressInput,
} from "@mall/types";

import { shippingAddressClient } from "@/lib/shippingAddressClient";

interface ShippingAddressState {
    addresses: ClientAddress[];

    loading: boolean;
    saving: boolean;
    error: string | null;

    fetchAddresses: () => Promise<void>;

    createAddress: (
        input: CreateClientAddressInput,
    ) => Promise<void>;

    updateAddress: (
        id: string,
        input: UpdateClientAddressInput,
    ) => Promise<void>;

    deleteAddress: (
        id: string,
    ) => Promise<void>;

    setDefaultAddress: (
        id: string,
    ) => Promise<void>;
}

export const useShippingAddressStore =
    create<ShippingAddressState>((set) => ({
        addresses: [],

        loading: false,
        saving: false,
        error: null,

        fetchAddresses: async () => {
            set({
                loading: true,
                error: null,
            });

            console.log(
                "[ShippingAddressStore] 배송지 조회 시작",
            );

            try {
                const addresses =
                    await shippingAddressClient.getMyAddresses();

                console.log(
                    "[ShippingAddressStore] 배송지 조회 성공:",
                    addresses,
                );

                set({
                    addresses,
                });
            } catch (error) {
                console.error(
                    "[ShippingAddressStore] 배송지 조회 실패:",
                    error,
                );

                const message =
                    error instanceof Error
                        ? error.message
                        : "배송지를 불러오지 못했습니다.";

                set({
                    error: message,
                });
            } finally {
                set({
                    loading: false,
                }); 
            }
        },

        createAddress: async (input) => {
            set({
                saving: true,
                error: null,
            });

            try {
                await shippingAddressClient.createAddress(
                    input,
                );

                const addresses =
                    await shippingAddressClient.getMyAddresses();

                set({
                    addresses,
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "배송지 추가에 실패했습니다.";

                set({
                    error: message,
                });

                throw error;
            } finally {
                set({
                    saving: false,
                });
            }
        },

        updateAddress: async (
            id,
            input,
        ) => {
            set({
                saving: true,
                error: null,
            });

            try {
                await shippingAddressClient.updateAddress(
                    id,
                    input,
                );

                const addresses =
                    await shippingAddressClient.getMyAddresses();

                set({
                    addresses,
                });
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "배송지 수정에 실패했습니다.";

                set({
                    error: message,
                });

                throw error;
            } finally {
                set({
                    saving: false,
                });
            }
        },

        deleteAddress: async (id) => {
            set({
                saving: true,
                error: null,
            });

            try {
                await shippingAddressClient.deleteAddress(
                    id,
                );

                set((state) => ({
                    addresses:
                        state.addresses.filter(
                            (address) =>
                                address.id !== id,
                        ),
                }));
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "배송지 삭제에 실패했습니다.";

                set({
                    error: message,
                });

                throw error;
            } finally {
                set({
                    saving: false,
                });
            }
        },

        setDefaultAddress: async (id) => {
            set({
                saving: true,
                error: null,
            });

            try {
                const addresses =
                    await shippingAddressClient.setDefaultAddress(
                        id,
                    );

                set((state) => ({
                    addresses: state.addresses.map(
                        (address) =>
                            address.id === id
                                ? {
                                    ...address,
                                    isDefault:
                                        true,
                                }
                                : {
                                    ...address,
                                    isDefault:
                                        false,
                                },
                    ),
                }));
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "기본 배송지 설정에 실패했습니다.";

                set({
                    error: message,
                });

                throw error;
            } finally {
                set({
                    saving: false,
                });
            }
        },
    }));