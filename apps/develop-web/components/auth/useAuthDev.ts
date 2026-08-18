import { useState, useEffect } from "react";
import { UserRole } from "@mall/types";
import { OAuthProvider, useAdminAuthStore } from "@/store/useAdminAuth";

export type AuthMode = "signIn" | "signUp";
export type ThirdPartyProvider = "google" | "kakao" | "facebook";

export function useAuthDev() {
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [provider, setProvider] = useState<ThirdPartyProvider>("google");

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const { user, thirdPartySignIn, getSession, signOut, completeOnboarding } = useAdminAuthStore();

  // 최초 진입 시 세션 확인
  useEffect(() => {
    getSession();
  }, [getSession]);

  const hasUser = Boolean(user);

  // 세션이 존재하면 (OAuth 리다이렉트 후 돌아온 경우 포함) 제출 상태를 true로 유지
  useEffect(() => {
    if (hasUser) {
      setIsSubmitted(true);
    }
  }, [hasUser]);

  // Discriminated Union / Narrowing 기반 유저 상태 판별
  const isClient = user?.role === "CLIENT";
  const isNewUser = hasUser && isClient && !(user as any).isOnboarded;
  const isExistingUser = hasUser && (!isClient || (user as any).isOnboarded);

  const handleSubmit = async () => {
    console.log("[AuthDev] 제출 조건:", { role, mode, provider });
    setIsSubmitted(true);

    if (mode === "signIn" && !hasUser) {
      // 로그인/회원가입 요청 시 OAuth 실행
      await thirdPartySignIn(provider as OAuthProvider);
    } else {
      // 단순 세션 조회/갱신
      await getSession();
    }
  };

  const handleReset = async () => {
    await signOut();
    setIsSubmitted(false);
  };

  return {
    role,
    setRole,
    mode,
    setMode,
    provider,
    setProvider,
    
    hasUser,
    isNewUser,       
    isExistingUser,  
    isSubmitted,
    user,

    handleSubmit,
    handleReset,
    getSession,
    completeOnboarding,
  };
}