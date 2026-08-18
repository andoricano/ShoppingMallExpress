// apps/develop-web/hooks/useAuthDev.ts
import { useState } from "react";
import { UserRole } from "@mall/types";
import { OAuthProvider, useAdminAuthStore } from "@/store/useAdminAuth";

export type AuthMode = "signIn" | "signUp";
export type ThirdPartyProvider = "google" | "kakao" | "facebook";

export function useAuthDev() {
  // [주석] 제출(확인) 버튼 누를 때 사용할 폼 입력 상태값
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [provider, setProvider] = useState<ThirdPartyProvider>("google");

  // [주석] 제출 버튼 클릭 여부 상태 (기본값 false로 지정하여 하단 패널 숨김)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // [주석] Zustand Auth Store 로드
  const { user, thirdPartySignIn, getSession, signOut } = useAdminAuthStore();

  // [주석] 유저 존재 여부는 Zustand store의 user 세션으로 자동 계산
  const hasUser = Boolean(user);

  // [주석] 확인 버튼 클릭 이벤트 핸들러
  const handleSubmit = async () => {
    console.log("[AuthDev] 제출 조건:", { role, mode, provider });
    
    // [주석] 제출 완료 상태로 전환 (하단 패널 노출)
    setIsSubmitted(true);

    // [주석] OAuth 로그인 실행 (인자로 넘겨받은 provider로 호출)
    if (provider) {
      await thirdPartySignIn(provider as OAuthProvider);
    }
  };

  // [주석] 상태 초기화 핸들러 (상태 리셋 시 하단 패널 닫기)
  const handleReset = async () => {
    await signOut();
    setIsSubmitted(false);
  };

  return {
    // 폼 상태
    role,
    setRole,
    mode,
    setMode,
    provider,
    setProvider,
    
    // 결과 및 UI 뷰 제어 상태
    hasUser,
    isSubmitted,
    user,

    // 액션
    handleSubmit,
    handleReset,
    getSession,
  };
}