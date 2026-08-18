// apps/develop-web/components/auth/AuthDevSection.tsx
"use client";

import { DevSelectedAuthBox } from "./DevSelectedAuthBox";
import { useAuthDev } from "./useAuthDev";

export function AuthDevSection() {
  const {
    role, setRole,
    mode, setMode,
    provider, setProvider,
    hasUser,
    isSubmitted,
    handleSubmit,
    handleReset,
  } = useAuthDev();

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
          {hasUser ? (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
              <p className="text-emerald-400 font-semibold mb-1">
                [User Found]
              </p>
              <p>유저가 존재합니다.</p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 text-zinc-400 underline hover:text-zinc-200"
              >
                상태 리셋
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
              <p className="text-amber-400 font-semibold mb-1">
                [User Not Found]
              </p>
              <p>유저 정보가 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}