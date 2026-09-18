"use client";

import { useState } from "react";

export interface ProfileCardData {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
}

export interface ProfileCardProps {
    profile: ProfileCardData | null;

    onCreate?: (
        data: Omit<ProfileCardData, "id" | "role">,
    ) => void | Promise<void>;

    onUpdate?: (
        data: Pick<
            ProfileCardData,
            "name" | "email" | "phone"
        >,
    ) => void | Promise<void>;

    onDelete?: () => void | Promise<void>;
}

export function ProfileCard({
    profile,
    onCreate,
    onUpdate,
    onDelete,
}: ProfileCardProps) {
    const [isEditing, setIsEditing] =
        useState(false);

    const [name, setName] =
        useState(profile?.name ?? "");

    const [email, setEmail] =
        useState(profile?.email ?? "");

    const [phone, setPhone] =
        useState(profile?.phone ?? "");

    const [saving, setSaving] =
        useState(false);

    const handleStartEdit = () => {
        setName(profile?.name ?? "");
        setEmail(profile?.email ?? "");
        setPhone(profile?.phone ?? "");

        setIsEditing(true);
    };

    const handleCancel = () => {
        setName(profile?.name ?? "");
        setEmail(profile?.email ?? "");
        setPhone(profile?.phone ?? "");

        setIsEditing(false);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            if (profile) {
                await onUpdate?.({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                });
            } else {
                await onCreate?.({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                });
            }

            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const confirmed =
            window.confirm(
                "프로필 정보를 삭제하시겠습니까?",
            );

        if (!confirmed) {
            return;
        }

        setSaving(true);

        try {
            await onDelete?.();
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        프로필
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        계정 기본 정보를 관리합니다.
                    </p>
                </div>

                {!isEditing && profile && (
                    <button
                        type="button"
                        onClick={handleStartEdit}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        수정
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            이름
                        </label>

                        <input
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target
                                        .value,
                                )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            이메일
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(
                                    event.target
                                        .value,
                                )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            전화번호
                        </label>

                        <input
                            value={phone}
                            onChange={(event) =>
                                setPhone(
                                    event.target
                                        .value,
                                )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                        />
                    </div>

                    {profile && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                권한
                            </label>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                                {profile.role}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={saving}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            취소
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving
                                ? "저장 중..."
                                : profile
                                    ? "저장"
                                    : "생성"}
                        </button>
                    </div>

                    {profile &&
                        onDelete && (
                            <div className="border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={
                                        handleDelete
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="text-sm font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
                                >
                                    프로필 삭제
                                </button>
                            </div>
                        )}
                </div>
            ) : profile ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            이름
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {profile.name}
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

                        <p className="mt-1 text-sm text-slate-700">
                            {profile.email}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-slate-500">
                            전화번호
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                            {profile.phone}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <p className="text-sm text-slate-500">
                        등록된 프로필이 없습니다.
                    </p>

                    {onCreate && (
                        <button
                            type="button"
                            onClick={() =>
                                setIsEditing(
                                    true,
                                )
                            }
                            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            프로필 생성
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}