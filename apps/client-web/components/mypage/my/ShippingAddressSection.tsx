"use client";

import {
    useEffect,
    useState,
} from "react";

import type { ClientAddress } from "@mall/types";

import { ShippingAddressCard } from "./ShippingAddressCard";
import { ShippingAddressEditCard } from "./ShippingAddressEditCard";
import { MyPageCardLayout } from "../MyPageCardLayout";

import { useShippingAddressStore } from "@/store/useShippingAddressStore";

export function ShippingAddressSection() {
    const {
        addresses,
        loading,
        saving,
        error,

        fetchAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
    } = useShippingAddressStore();

    const [
        editingAddress,
        setEditingAddress,
    ] = useState<ClientAddress | null>(
        null,
    );

    const [isCreating, setIsCreating] =
        useState(false);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const isEditing =
        isCreating ||
        editingAddress !== null;

    const handleCreate = async (
        data: Parameters<
            typeof createAddress
        >[0],
    ) => {
        await createAddress(data);
        setIsCreating(false);
    };

    const handleUpdate = async (
        data: Parameters<
            typeof createAddress
        >[0],
    ) => {
        if (!editingAddress) {
            return;
        }

        await updateAddress(
            editingAddress.id,
            data,
        );

        setEditingAddress(null);
    };

    const handleDelete = async (
        address: ClientAddress,
    ) => {
        await deleteAddress(address.id);
    };

    const handleSetDefault = async (
        address: ClientAddress,
    ) => {
        await setDefaultAddress(
            address.id,
        );
    };

    return (
        <MyPageCardLayout
            title="배송지"
            description="배송지를 관리합니다."
            actions={
                !isEditing
                    ? [
                          {
                              label: "배송지 추가",
                              onClick: () => {
                                  setEditingAddress(
                                      null,
                                  );
                                  setIsCreating(
                                      true,
                                  );
                              },
                          },
                      ]
                    : []
            }
        >
            {loading ? (
                <p className="text-sm text-slate-500">
                    배송지를 불러오는 중입니다...
                </p>
            ) : (
                <>
                    {error && (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {isCreating && (
                        <ShippingAddressEditCard
                            saving={saving}
                            error={error}
                            onSave={handleCreate}
                            onCancel={() =>
                                setIsCreating(
                                    false,
                                )
                            }
                        />
                    )}

                    {editingAddress && (
                        <ShippingAddressEditCard
                            address={
                                editingAddress
                            }
                            saving={saving}
                            error={error}
                            onSave={handleUpdate}
                            onCancel={() =>
                                setEditingAddress(
                                    null,
                                )
                            }
                        />
                    )}

                    {!isEditing && (
                        <>
                            {addresses.length ===
                            0 ? (
                                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                                    <p className="text-sm text-slate-500">
                                        등록된 배송지가
                                        없습니다.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsCreating(
                                                true,
                                            )
                                        }
                                        className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        배송지 추가
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {addresses.map(
                                        (
                                            address,
                                        ) => (
                                            <ShippingAddressCard
                                                key={
                                                    address.id
                                                }
                                                address={
                                                    address
                                                }
                                                onEdit={(
                                                    nextAddress,
                                                ) => {
                                                    setIsCreating(
                                                        false,
                                                    );
                                                    setEditingAddress(
                                                        nextAddress,
                                                    );
                                                }}
                                                onDelete={
                                                    handleDelete
                                                }
                                                onSetDefault={
                                                    handleSetDefault
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </MyPageCardLayout>
    );
}