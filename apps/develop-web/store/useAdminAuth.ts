// apps/develop-web/store/useAdminAuth.ts
import { create } from "zustand";
import { AdminProfile, UserProfile } from "@mall/types";
import { createClient } from "../lib/supabase/client";
import { Provider } from "@supabase/supabase-js";

export type OAuthProvider = "google" | "kakao" | "facebook";

interface AdminAuthState {
  user: UserProfile | null;
  thirdPartySignIn: (provider: OAuthProvider) => Promise<void>;
  getSession: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const supabase = createClient();

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,

  thirdPartySignIn: async (provider: OAuthProvider) => {
    console.log(`[AdminAuth] ${provider} OAuth 로그인 요청 시도`);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
      },
    });

    if (error) {
      console.error(`[AdminAuth] ${provider} 로그인 실패:`, error.message);
    }
  },

  getSession: async () => {
    console.log("[AdminAuth] 세션 확인(GetSession) 시도");

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    const isAuthenticated = Boolean(session && !error);

    if (!isAuthenticated) {
      console.log("[AdminAuth] ❌ 현재 로그인 상태: 로그인 안 됨 (Unauthenticated)");
      if (error) {
        console.error("[AdminAuth] 세션 조회 에러 상세:", error.message);
      }
      set({ user: null });
      return;
    }

    const authUser = session!.user;

    const adminUser: AdminProfile = {
      id: authUser.id,
      email: authUser.email ?? "",
      name:
        authUser.user_metadata?.full_name ??
        authUser.user_metadata?.name ??
        "소셜 관리자",
      role: "ADMIN",
      department: "운영팀",
      createdAt: authUser.created_at,
      updatedAt: authUser.updated_at ?? authUser.created_at,
    };

    set({ user: adminUser });
    console.log("[AdminAuth] ✅ 현재 로그인 상태: 로그인 됨 (Authenticated)");
    console.log("[AdminAuth] 로그인 유저 정보:", adminUser);
  },

  signOut: async () => {
    console.log("[AdminAuth] 로그아웃(SignOut) 시도");

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[AdminAuth] 로그아웃 실패:", error.message);
    }

    set({ user: null });
    console.log("[AdminAuth] Admin 세션 클리어 완료");
  },

  deleteAccount: async () => {
    console.log("[AdminAuth] 회원탈퇴(DeleteAccount) 버튼 클릭됨");

    await supabase.auth.signOut();
    set({ user: null });
    console.log("[AdminAuth] Admin 계정 세션 제거 완료");
  },
}));