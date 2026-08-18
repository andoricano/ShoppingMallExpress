// @/components/auth/UserAuthBox.tsx
"use client";

import { useState } from "react";
import { UserProfile } from "@mall/types"; 
import { AuthButton } from "./AuthButton";
import { UpdateUserBox, UpdateUserProfileInput } from "./UpdateUserBox";

interface UserAuthBoxProps {
  type: "Client" | "Admin";
  user: UserProfile | null; 
  onGetSession: () => void;
  onSaveProfile: (updatedData: UpdateUserProfileInput) => Promise<void> | void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export function UserAuthBox({
  type,
  user,
  onGetSession,
  onSaveProfile,
  onSignOut,
  onDeleteAccount,
}: UserAuthBoxProps) {
  const [isEditing, setIsEditing] = useState(false);

  // 수정하기 클릭 시 UpdateUserBox로 대체
  if (isEditing) {
    return (
      <UpdateUserBox
        type={type}
        user={user}
        onSaveProfile={async (data) => {
          await onSaveProfile(data);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const isAdmin = type === "Admin";

  const badgeStyle = isAdmin
    ? "text-blue-400 bg-blue-950/60 border-blue-800/50"
    : "text-emerald-400 bg-emerald-950/60 border-emerald-800/50";

  const roleTextStyle = isAdmin
    ? "text-blue-400 font-bold"
    : "text-emerald-400 font-bold";

  // Client 타입인 경우 온보딩 상태 확인
  const isOnboarded = user && "isOnboarded" in user ? user.isOnboarded : null;

  return (
    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col gap-5">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
            {type.toUpperCase()}
          </span>
          <h3 className="text-sm font-semibold text-white">
            {isAdmin ? "관리자" : "일반 유저"} 프로필 상세
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          Status: {user ? "Authenticated" : "Unauthenticated"}
        </span>
      </div>

      {/* 유저 정보 박스 */}
      <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex flex-col gap-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-zinc-500">ID:</span>
          <span className={user?.id ? "text-zinc-200" : "text-zinc-600"}>
            {user?.id || "null"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Email:</span>
          <span className={user?.email ? "text-zinc-200" : "text-zinc-600"}>
            {user?.email || "null"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Name:</span>
          <span className={user?.name ? "text-zinc-200" : "text-zinc-600"}>
            {user?.name || "null"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Role:</span>
          <span className={user?.role ? roleTextStyle : "text-zinc-600"}>
            {user?.role || "guest"}
          </span>
        </div>
        {!isAdmin && (
          <div className="flex justify-between pt-1 border-t border-zinc-800/50">
            <span className="text-zinc-500">Onboarded:</span>
            <span className={isOnboarded ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {isOnboarded === null ? "null" : isOnboarded ? "true (기존)" : "false (신규)"}
            </span>
          </div>
        )}
      </div>

      {/* 2x2 버튼 영역 (4개 정리) */}
      <div className="grid grid-cols-2 gap-2">
        <AuthButton label="1. 가져오기 (새로고침)" onClick={onGetSession} />
        <AuthButton label="2. 수정하기" onClick={() => setIsEditing(true)} />
        <AuthButton label="3. 로그아웃" onClick={onSignOut} />
        <AuthButton label="4. 탈퇴하기" onClick={onDeleteAccount} variant="danger" />
      </div>
    </div>
  );
}