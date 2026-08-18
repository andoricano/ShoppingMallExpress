"use client";

import { DevSelectedAuthBox } from "./DevSelectedAuthBox";
import { UpdateUserProfileInput } from "./UpdateUserBox";
import { useAuthDev } from "./useAuthDev";
import { UserAuthBox } from "./UserAuthBox";

export function AuthDevSection() {
  const {
    role, setRole,
    mode, setMode,
    provider, setProvider,
    isSubmitted,
    hasUser,
    isNewUser,
    isExistingUser,
    user,
    handleSubmit,
    handleReset,
    getSession,
    completeOnboarding,
  } = useAuthDev();

  // 프로필 정보 수정 및 온보딩 등록 처리
  const handleSaveProfile = async (data: UpdateUserProfileInput) => {
    try {
      await completeOnboarding({
        recipientName: data.recipientName ?? "",
        phone: data.phone ?? "",
        zonecode: data.zonecode ?? "",
        address: data.address ?? "",
        addressDetail: data.addressDetail ?? "",
        termsAgreed: true,
      });
      alert("프로필 정보 저장이 완료되었습니다.");
      // 저장 후 최신 세션 정보 다시 로드
      await getSession();
    } catch (error: any) {
      alert(`저장 실패: ${error.message}`);
    }
  };

  return (
    <section className="flex flex-col gap-6 max-w-md w-full mx-auto p-4">
      {/* Dev 선택 패널 */}
      <DevSelectedAuthBox
        role={role}
        mode={mode}
        provider={provider}
        onRoleChange={setRole}
        onModeChange={setMode}
        onProviderChange={setProvider}
        onSubmit={handleSubmit}
      />

      {isSubmitted && (
        <div className="flex flex-col gap-2">
          {/* 1. 로그인 성공 (온보딩 완료 및 미완료 유저 모두 UserAuthBox 사용) */}
          {hasUser && user && (
            <>
              {isNewUser && (
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 mb-1">
                  <p className="font-semibold text-amber-400">⚠️ 온보딩 미완료 상태입니다.</p>
                  <p className="mt-0.5 text-zinc-400">
                    아래 [2. 수정하기] 버튼을 눌러 추가 정보를 저장하고 온보딩을 완료해 주세요.
                  </p>
                </div>
              )}
              <UserAuthBox
                type={user.role === "ADMIN" ? "Admin" : "Client"}
                user={user}
                onGetSession={getSession}
                onSaveProfile={handleSaveProfile}
                onSignOut={handleReset}
                onDeleteAccount={() => alert("탈퇴 기능 실행")}
              />
            </>
          )}

          {/* 2. 유저 정보 없음 */}
          {!hasUser && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
              <p className="text-amber-400 font-semibold mb-1">
                [User Not Found]
              </p>
              <p>유저 정보가 없습니다. 소셜 로그인을 진행해주세요.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}