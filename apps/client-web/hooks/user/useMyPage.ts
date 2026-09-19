"use client";

import { useCallback, useState } from "react";

import type { MyPageSidebarItem } from "@/components/mypage/MyPageSidbar";

export const MY_PAGE_SECTION = {
    INFO: "info",
    POINT: "point",
    HISTORY: "history",
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
        id: MY_PAGE_SECTION.INFO,
        label: "프로필",
    },
    {
        type: "sub",
        id: MY_PAGE_SECTION.POINT,
        label: "포인트",
    },
    {
        type: "sub",
        id: MY_PAGE_SECTION.HISTORY,
        label: "주문내역",
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
            MY_PAGE_SECTION.INFO,
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