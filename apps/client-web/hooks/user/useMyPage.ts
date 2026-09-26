"use client";

import { useCallback, useState } from "react";

import type { MyPageSidebarItem } from "@/components/mypage/MyPageSidbar";
import { MALL_V3 } from "@/lib/mallVersion";

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
        // v3 (BR-49): Point payment is out of the initial scope, so the Point
        // menu is hidden (the data and RPCs stay; removal is decided after release).
        sidebarItems: MALL_V3
            ? DEFAULT_SIDEBAR_ITEMS.filter((item) => item.id !== MY_PAGE_SECTION.POINT)
            : DEFAULT_SIDEBAR_ITEMS,
        selectedId,
        selectSection,
    };
}