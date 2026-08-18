// apps/develop-web/components/auth/UserProfileCard.tsx
"use client";

import { UserProfile } from "@mall/types";

interface UserProfileCardProps {
  profile: UserProfile;
  onSignOut?: () => void;
}

export function UserProfileCard({ profile, onSignOut }: UserProfileCardProps) {
  const isAdmin = profile.role === "ADMIN";

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isAdmin
                ? "bg-purple-950/60 text-purple-400 border border-purple-800/50"
                : "bg-blue-950/60 text-blue-400 border border-blue-800/50"
            }`}
          >
            {profile.role}
          </span>
          <span className="font-semibold text-zinc-200">
            {profile.name ?? "이름 없음"}
          </span>
        </div>
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 underline transition-colors"
          >
            로그아웃
          </button>
        )}
      </div>

      {/* 공통 프로필 정보 */}
      <div className="grid grid-cols-1 gap-2 text-zinc-300">
        <div className="flex justify-between">
          <span className="text-zinc-500">ID (UID)</span>
          <span className="font-mono text-zinc-400 truncate max-w-[180px]">
            {profile.id}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Email</span>
          <span className="text-zinc-300">{profile.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Created At</span>
          <span className="text-zinc-400">{profile.createdAt}</span>
        </div>
      </div>

      {/* 역할별 상세 프로필 정보 */}
      <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-2">
        {isAdmin ? (
          /* ADMIN 전용 정보 */
          <div className="flex justify-between">
            <span className="text-zinc-500">부서 (Department)</span>
            <span className="text-zinc-300">
              {profile.department ?? "미지정"}
            </span>
          </div>
        ) : (
          /* CLIENT 전용 정보 */
          <>
            <div className="flex justify-between">
              <span className="text-zinc-500">수령인</span>
              <span className="text-zinc-300">
                {profile.recipientName ?? "미입력"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">연락처</span>
              <span className="text-zinc-300">{profile.phone ?? "미입력"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">온보딩 완료 여부</span>
              <span
                className={
                  profile.isOnboarded ? "text-emerald-400" : "text-amber-400"
                }
              >
                {profile.isOnboarded ? "완료 (TRUE)" : "미완료 (FALSE)"}
              </span>
            </div>
            {profile.address && (
              <div className="mt-1 p-2 rounded bg-zinc-900 border border-zinc-800/80 flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 font-semibold">
                  배송지 정보
                </span>
                <p className="text-zinc-300">
                  [{profile.address.zonecode}] {profile.address.address}
                </p>
                <p className="text-zinc-400">{profile.address.detail}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}