"use client";

import { SelectGroup, SelectOption } from "./SelectGroup";
import { AuthButton } from "./AuthButton";
import { UserRole } from "@mall/types";
import { AuthMode } from "./useAuthDev";
import { OAuthProvider } from "@/store/useAdminAuth";

interface DevSelectedAuthBoxProps {
  role: UserRole;
  mode: AuthMode;
  provider: OAuthProvider;

  onRoleChange: (role: UserRole) => void;
  onModeChange: (mode: AuthMode) => void;
  onProviderChange: (provider: OAuthProvider) => void;

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

const PROVIDER_OPTIONS: SelectOption<OAuthProvider>[] = [
  { label: "Google", value: "google" },
  { label: "Kakao", value: "kakao" },
  { label: "Insta", value: "facebook" },
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
      <SelectGroup<OAuthProvider>
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