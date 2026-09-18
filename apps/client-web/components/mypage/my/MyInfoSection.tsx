// components/mypage/MyInfoSection.tsx

"use client";

import { useEffect, useState } from "react";


import { MyProfileCard } from "./MyProfileCard";
import { useClientAuthStore } from "@/store/useClientAuthStore";
import { MyEditProfileCard } from "./MyProfileEditCard";

export function MyInfoSection() {
    const {
        user,
        loading,
        error,
        getProfile,
        updateProfile,
    } = useClientAuthStore();

    const [
        isEditingProfile,
        setIsEditingProfile,
    ] = useState(false);

    const [
        savingProfile,
        setSavingProfile,
    ] = useState(false);

    useEffect(() => {
        if (!user) {
            getProfile();
        }
    }, [user, getProfile]);

    const handleProfileSave = async ({
        name,
        phone,
    }: {
        name: string;
        phone: string;
    }) => {
        setSavingProfile(true);

        try {
            await updateProfile(
                name,
                phone,
            );

            setIsEditingProfile(false);
        } finally {
            setSavingProfile(false);
        }
    };

    if (loading && !user) {
        return (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">
                    회원 정보를 불러오는 중입니다...
                </p>
            </section>
        );
    }

    if (!user) {
        return (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">
                    회원 정보를 불러오지 못했습니다.
                </p>

                {error && (
                    <p className="mt-2 text-sm text-rose-600">
                        {error}
                    </p>
                )}
            </section>
        );
    }

    return (
        <section className="space-y-6">
            {isEditingProfile ? (
                <MyEditProfileCard
                    profile={user}
                    saving={savingProfile}
                    error={error}
                    onSave={
                        handleProfileSave
                    }
                    onCancel={() =>
                        setIsEditingProfile(false)
                    }
                />
            ) : (
                <MyProfileCard
                    profile={user}
                    onEdit={() =>
                        setIsEditingProfile(true)
                    }
                />
            )}

            {/* 추후 ShippingAddress */}
        </section>
    );
}