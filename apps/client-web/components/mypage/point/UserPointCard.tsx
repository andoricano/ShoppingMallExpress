"use client";

import Image from "next/image";

import { MyPageCardLayout } from "@/components/mypage/MyPageCardLayout";

interface UserPointCardProps {
    balance: number;
}

export function UserPointCard({
    balance,
}: UserPointCardProps) {
    return (
        <MyPageCardLayout
            title="보유 포인트"
            description="현재 사용할 수 있는 포인트입니다."
        >
            <div className="flex items-center gap-5 rounded-xl bg-slate-50 px-5 py-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                    <Image
                        src="/ic_target_512.png"
                        alt="포인트"
                        width={42}
                        height={42}
                        className="object-contain"
                    />
                </div>

                <div className="min-w-0">
                    <p className="text-4xl font-bold tracking-tight text-slate-900">
                        {balance.toLocaleString(
                            "ko-KR",
                        )}
                        <span className="ml-1 text-xl font-semibold text-slate-500">
                            P
                        </span>
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                        현재 보유 포인트
                    </p>
                </div>
            </div>
        </MyPageCardLayout>
    );
}