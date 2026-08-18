// apps/develop-web/components/auth/AuthDevSection.tsx
"use client";

import { DevSelectedAuthBox } from "./DevSelectedAuthBox";
import { UserProfileCard } from "./UserProfileCard";
import { ClientOnboardingForm } from "./ClientOnboardingForm";
import { UserProfile } from "@mall/types";
import { useAuthDev } from "./useAuthDev";

// 임시 테스트용 유저 프로필 데이터
const MOCK_PROFILE: UserProfile = {
  id: "usr_12345",
  email: "test@mall.com",
  name: "테스트 유저",
  role: "CLIENT",
  createdAt: "2026-03-18T10:00:00Z",
  updatedAt: "2026-03-18T10:00:00Z",
  recipientName: "홍길동",
  phone: "010-1234-5678",
  isOnboarded: true,
  address: {
    zonecode: "06134",
    address: "서울시 강남구 테헤란로 123",
    detail: "401호",
  },
};

export function AuthDevSection() {
  const {
    role, setRole,
    mode, setMode,
    provider, setProvider,
    hasUser, setHasUser,
    handleSubmit,
  } = useAuthDev();

  return (
    <section className="flex flex-col gap-6 max-w-md w-full mx-auto p-4">
      <DevSelectedAuthBox
        role={role}
        mode={mode}
        provider={provider}
        onRoleChange={setRole}
        onModeChange={setMode}
        onProviderChange={setProvider}
        onSubmit={handleSubmit}
      />

      <div className="flex flex-col gap-2">
        {hasUser ? (
          /* 유저가 존재할 때: 전체 정보 조회 카드 */
          <UserProfileCard
            profile={MOCK_PROFILE}
            onSignOut={() => setHasUser(false)}
          />
        ) : (
          /* 유저가 없을 때: 회원가입(온보딩) 폼 */
          <ClientOnboardingForm
            onSubmit={(data) => {
              console.log("[AuthDev] 온보딩 제출 데이터:", data);
              setHasUser(true); // 온보딩 후 유저 상태 전환 테스트
            }}
          />
        )}
      </div>
    </section>
  );
}