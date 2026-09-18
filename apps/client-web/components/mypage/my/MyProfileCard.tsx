"use client";

import type { ClientProfile } from "@mall/types";

interface MyProfileCardProps {
    profile: ClientProfile;
}

export function MyProfileCard({
    profile,
}: MyProfileCardProps) {
    return (
        <div>
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
        </div>
    );
}