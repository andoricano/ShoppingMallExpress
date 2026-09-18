"use client";

import { useCallback, useState } from "react";

import type { MyPageSidebarItem } from "@/components/mypage/MyPageSidbar";

export const MY_PAGE_SECTION = {
    PROFILE: "profile",
    ADDRESS: "address",
    POINT: "point",
    AGREEMENT: "agreement",
    WITHDRAW: "withdraw",
} as const;

export type MyPageSection =
    (typeof MY_PAGE_SECTION)[keyof typeof MY_PAGE_SECTION];

const DEFAULT_SIDEBAR_ITEMS: MyPageSidebarItem[] = [
    {
        type: "main",
        id: "account",
        label: "내 정보",
    },
    {
        type: "sub",
        id: MY_PAGE_SECTION.PROFILE,
        label: "프로필",
    },
    {
        type: "sub",
        id: MY_PAGE_SECTION.ADDRESS,
        label: "배송지",
    },
    {
        type: "sub",
        id: MY_PAGE_SECTION.POINT,
        label: "포인트",
    },
    {
        type: "divider",
        id: "divider-1",
    },
    {
        type: "sub",
        id: MY_PAGE_SECTION.AGREEMENT,
        label: "약관 및 동의",
    },
    {
        type: "divider",
        id: "divider-2",
    },
    {
        type: "sub",
        id: MY_PAGE_SECTION.WITHDRAW,
        label: "회원 탈퇴",
    },
];

export function useMyPage() {
    const [selectedId, setSelectedId] =
        useState<MyPageSection>(
            MY_PAGE_SECTION.PROFILE,
        );

    const selectSection = useCallback(
        (id: string) => {
            const section = Object.values(
                MY_PAGE_SECTION,
            ).find((value) => value === id);

            if (!section) {
                return;
            }

            setSelectedId(section);
        },
        [],
    );

    return {
        sidebarItems: DEFAULT_SIDEBAR_ITEMS,
        selectedId,
        selectSection,
    };
}