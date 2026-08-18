    // apps/develop-web/hooks/useAuthDev.ts
import { useState } from "react";
import { UserRole } from "@mall/types";

export type AuthMode = "signIn" | "signUp";
export type ThirdPartyProvider = "google" | "kakao" | "github";

export function useAuthDev() {
  // [주석] 제출(확인) 버튼 누를 때만 사용할 폼 입력 상태값
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [provider, setProvider] = useState<ThirdPartyProvider>("google");

  // [주석] 조회 결과에 따른 뷰 상태 (유저 정보 존재 여부)
  const [hasUser, setHasUser] = useState<boolean>(false);

  // [주석] 확인 버튼 클릭 이벤트 핸들러
  const handleSubmit = () => {
    console.log("[AuthDev] 제출 조건:", { role, mode, provider });
    // TODO: 추후 선택 조건에 따른 유저 존재 여부 확인 로직 연결
  };

  return {
    // 폼 상태
    role,
    setRole,
    mode,
    setMode,
    provider,
    setProvider,
    
    // 뷰 분기 상태
    hasUser,
    setHasUser,

    // 액션
    handleSubmit,
  };
}