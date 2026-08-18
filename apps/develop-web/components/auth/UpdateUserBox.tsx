// @/components/auth/UpdateUserBox.tsx
"use client";

import { useState } from "react";
import { UserProfile } from "@mall/types";
import { AuthButton } from "./AuthButton";

export interface UpdateUserProfileInput {
  name: string;
  recipientName?: string;
  phone?: string;
  zonecode?: string;
  address?: string;
  addressDetail?: string;
}

interface UpdateUserBoxProps {
  type: "Client" | "Admin";
  user: UserProfile | null;
  onSaveProfile: (updatedData: UpdateUserProfileInput) => Promise<void> | void;
  onCancel: () => void;
}

export function UpdateUserBox({
  type,
  user,
  onSaveProfile,
  onCancel,
}: UpdateUserBoxProps) {
  const isAdmin = type === "Admin";
  const isClientUser = user && "recipientName" in user;

  // 기존 유저 데이터로 input 초기화
  const [formData, setFormData] = useState<UpdateUserProfileInput>({
    name: user?.name ?? "",
    recipientName: isClientUser ? (user.recipientName ?? "") : "",
    phone: isClientUser ? (user.phone ?? "") : "",
    zonecode: isClientUser ? (user.address?.zonecode ?? "") : "",
    address: isClientUser ? (user.address?.address ?? "") : "",
    addressDetail: isClientUser ? (user.address?.detail ?? "") : "",
  });

  const handleSave = async () => {
    await onSaveProfile(formData);
  };

  const badgeStyle = isAdmin
    ? "text-blue-400 bg-blue-950/60 border-blue-800/50"
    : "text-emerald-400 bg-emerald-950/60 border-emerald-800/50";

  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col gap-5">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
            {type.toUpperCase()}
          </span>
          <h3 className="text-sm font-semibold text-white">유저 정보 수정</h3>
        </div>
      </div>

      {/* Input 수정 영역 */}
      <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex flex-col gap-3 text-xs font-mono">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-zinc-500">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Client 전용 필드 */}
        {!isAdmin && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-zinc-500">Recipient Name</label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-500">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-500">Address / Detail</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="우편번호"
                  value={formData.zonecode}
                  onChange={(e) => setFormData({ ...formData, zonecode: e.target.value })}
                  className="w-1/3 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="주소"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-2/3 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <input
                type="text"
                placeholder="상세주소"
                value={formData.addressDetail}
                onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </>
        )}
      </div>

      {/* 하단 버튼 (취소 / 저장) */}
      <div className="grid grid-cols-2 gap-2">
        <AuthButton label="취소" onClick={onCancel} />
        <AuthButton label="저장하기 (Save)" onClick={handleSave} variant="primary" />
      </div>
    </div>
  );
}