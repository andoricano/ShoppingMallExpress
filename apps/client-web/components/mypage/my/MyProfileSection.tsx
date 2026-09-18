"use client";

import { useEffect, useState } from "react";

import { MyProfileCard } from "./MyProfileCard";
import { MyProfileEditCard } from "./MyProfileEditCard";
import { MyPageCardLayout } from "../MyPageCardLayout";
import { useClientAuthStore } from "@/store/useClientAuthStore";

export function MyProfileSection() {
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
            <MyPageCardLayout
                title="프로필"
                description="기본 개인정보를 관리합니다."
            >
                <p className="text-sm text-slate-500">
                    회원 정보를 불러오는 중입니다...
                </p>
            </MyPageCardLayout>
        );
    }

    if (!user) {
        return (
            <MyPageCardLayout
                title="프로필"
                description="기본 개인정보를 관리합니다."
            >
                <p className="text-sm text-slate-500">
                    회원 정보를 불러오지 못했습니다.
                </p>

                {error && (
                    <p className="mt-2 text-sm text-rose-600">
                        {error}
                    </p>
                )}
            </MyPageCardLayout>
        );
    }

    return (
        <MyPageCardLayout
            title="프로필"
            description="기본 개인정보를 관리합니다."
            actions={
                !isEditingProfile
                    ? [
                          {
                              icon: (
                                  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                  >
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                  </svg>
                              ),
                              onClick: () =>
                                  setIsEditingProfile(
                                      true,
                                  ),
                              ariaLabel:
                                  "프로필 수정",
                          },
                      ]
                    : []
            }
        >
            {isEditingProfile ? (
                <MyProfileEditCard
                    profile={user}
                    saving={savingProfile}
                    error={error}
                    onSave={handleProfileSave}
                    onCancel={() =>
                        setIsEditingProfile(
                            false,
                        )
                    }
                />
            ) : (
                <MyProfileCard
                    profile={user}
                />
            )}
        </MyPageCardLayout>
    );
}