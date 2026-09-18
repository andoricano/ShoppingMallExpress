"use client";

import type { ClientProfile } from "@mall/types";

interface MyProfileCardProps {
    profile: ClientProfile;
    onEdit: () => void;
}

export function MyProfileCard({
    profile,
    onEdit,
}: MyProfileCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        프로필
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        기본 개인정보를 확인합니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                    수정
                </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <p className="text-xs font-medium text-slate-500">
                        이름
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                        {profile.name ||
                            "이름이 없습니다."}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-medium text-slate-500">
                        권한
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                        {profile.role}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-medium text-slate-500">
                        이메일
                    </p>

                    <p className="mt-1 break-all text-sm text-slate-700">
                        {profile.email}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-medium text-slate-500">
                        전화번호
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                        {profile.phone ||
                            "전화번호가 없습니다."}
                    </p>
                </div>
            </div>
        </section>
    );
}