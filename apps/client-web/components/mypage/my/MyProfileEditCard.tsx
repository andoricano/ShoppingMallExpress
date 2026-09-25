"use client";

import { useEffect, useState } from "react";
import type { ClientProfile } from "@mall/types";

interface MyProfileEditCardProps {
    profile: ClientProfile;
    email: string | null;
    saving?: boolean;
    error?: string | null;

    onSave: (data: {
        name: string;
        phone: string;
    }) => void | Promise<void>;

    onCancel: () => void;
}

export function MyProfileEditCard({
    profile,
    email,
    saving = false,
    error = null,
    onSave,
    onCancel,
}: MyProfileEditCardProps) {
    const [name, setName] =
        useState(profile.name ?? "");

    const [phone, setPhone] =
        useState(profile.phone ?? "");

    useEffect(() => {
        setName(profile.name ?? "");
        setPhone(profile.phone ?? "");
    }, [profile]);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        await onSave({
            name: name.trim(),
            phone: phone.trim(),
        });
    };

    return (
        <div>
            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    프로필 수정
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    기본 개인정보를 수정합니다.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
            >
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        이름
                    </label>

                    <input
                        type="text"
                        value={name}
                        onChange={(event) =>
                            setName(
                                event.target.value,
                            )
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-500 disabled:bg-slate-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        이메일
                    </label>

                    <input
                        type="email"
                        value={email ?? ""}
                        disabled
                        className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                        이메일은 로그인 계정 정보이므로 여기서
                        변경하지 않습니다.
                    </p>
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        전화번호
                    </label>

                    <input
                        type="tel"
                        value={phone}
                        onChange={(event) =>
                            setPhone(
                                event.target.value,
                            )
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-slate-500 disabled:bg-slate-100"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        권한
                    </label>

                    <input
                        type="text"
                        value={profile.role}
                        disabled
                        className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                    />
                </div>

                {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        취소
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving
                            ? "저장 중..."
                            : "저장하기"}
                    </button>
                </div>
            </form>
        </div>
    );
}