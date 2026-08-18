"use client";

import { DevSelectedAuthBox } from "./DevSelectedAuthBox";
import { UserAuthBox } from "./AdminAuthBox";
import { useAuthDev } from "./useAuthDev";

export function AuthDevSection() {
  const {
    role,
    setRole,
    mode,
    setMode,
    provider,
    setProvider,
    hasUser,
    handleSubmit,
  } = useAuthDev();

  return (
    <section className="flex flex-col gap-6 max-w-md w-full mx-auto p-4">
      {/* 1. 컨트롤 패널 (Role, Mode, Provider 선택 덤브 컴포넌트) */}
      <DevSelectedAuthBox
        role={role}
        mode={mode}
        provider={provider}
        onRoleChange={setRole}
        onModeChange={setMode}
        onProviderChange={setProvider}
        onSubmit={handleSubmit}
      />

      {/* 2. 결과 분기 (유저 존재 여부에 따른 UI 출력) */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
        {hasUser ? (
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Profile View (User Found)
            </h4>
            {/* [주석] 유저가 존재할 때 기존 UserAuthBox 렌더링 */}
            {/* <UserAuthBox /> */}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Registration View (User Not Found)
            </h4>
            <p className="text-xs text-zinc-400">
              선택한 조건의 유저가 없습니다. 회원가입 절차를 진행해 주세요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}