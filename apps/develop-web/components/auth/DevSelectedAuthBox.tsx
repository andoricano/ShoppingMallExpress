// apps/develop-web/components/auth/DevSelectedAuthBox.tsx
"use client";

import { SelectGroup, SelectOption } from "./SelectGroup";
import { AuthButton } from "./AuthButton";
import { UserRole } from "@mall/types";
import { AuthMode, ThirdPartyProvider } from "./useAuthDev";

interface DevSelectedAuthBoxProps {
  // 선택된 상태값 (외부에서 주입)
  role: UserRole;
  mode: AuthMode;
  provider: ThirdPartyProvider;

  // 상태 변경 핸들러
  onRoleChange: (role: UserRole) => void;
  onModeChange: (mode: AuthMode) => void;
  onProviderChange: (provider: ThirdPartyProvider) => void;

  // 제출 버튼 클릭 이벤트 핸들러
  onSubmit: () => void;
}

const ROLE_OPTIONS: SelectOption<UserRole>[] = [
  { label: "Admin", value: "ADMIN" },
  { label: "Client", value: "CLIENT" },
];

const MODE_OPTIONS: SelectOption<AuthMode>[] = [
  { label: "Sign In", value: "signIn" },
  { label: "Sign Up", value: "signUp" },
];

const PROVIDER_OPTIONS: SelectOption<ThirdPartyProvider>[] = [
  { label: "Google", value: "google" },
  { label: "Kakao", value: "kakao" },
  { label: "GitHub", value: "github" },
];

export function DevSelectedAuthBox({
  role,
  mode,
  provider,
  onRoleChange,
  onModeChange,
  onProviderChange,
  onSubmit,
}: DevSelectedAuthBoxProps) {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
      <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
        Dev Auth Config
      </h3>

      {/* 1. Admin vs Client 선택 */}
      <SelectGroup<UserRole>
        title="Role"
        options={ROLE_OPTIONS}
        selectedValue={role}
        onChange={onRoleChange}
      />

      {/* 2. Sign In vs Sign Up 선택 */}
      <SelectGroup<AuthMode>
        title="Mode"
        options={MODE_OPTIONS}
        selectedValue={mode}
        onChange={onModeChange}
      />

      {/* 3. ThirdParty Provider 선택 */}
      <SelectGroup<ThirdPartyProvider>
        title="Provider"
        options={PROVIDER_OPTIONS}
        selectedValue={provider}
        onChange={onProviderChange}
      />

      {/* 4. 확인(제출) 버튼 */}
      <div className="pt-2 border-t border-zinc-800/80">
        <AuthButton
          label="확인 (Submit)"
          onClick={onSubmit}
          variant="primary"
        />
      </div>
    </div>
  );
}