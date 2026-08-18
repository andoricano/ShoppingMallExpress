// apps/develop-web/store/useAdminAuth.ts
import { create } from "zustand";
import { AdminProfile, UserProfile } from "@mall/types";
import { createClient } from "../lib/supabase/client";

interface AdminAuthState {
  user: UserProfile | null;
  signUp: () => void;
  signIn: () => void;
  googleSignIn: () => Promise<void>;
  getSession: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const supabase = createClient();

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,

  signUp: () => {
    console.log("[AdminAuth] 일반 회원가입 버튼 클릭됨 (Google OAuth 권장)");
  },

  signIn: () => {
    console.log("[AdminAuth] 일반 로그인 버튼 클릭됨 (Google OAuth 권장)");
  },

  googleSignIn: async () => {
    console.log("[AdminAuth] Google 로그인(GoogleSignIn) 요청 시도");
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("[AdminAuth] Google 로그인 실패:", error.message);
    }
  },

  getSession: async () => {
    console.log("[AdminAuth] 세션 확인(GetSession) 시도");
    
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      console.log("[AdminAuth] 현재 세션 없음 (Unauthenticated)");
      set({ user: null });
      return;
    }

    const authUser = session.user;

    const adminUser: AdminProfile = {
      id: authUser.id,
      email: authUser.email ?? "",
      name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? "Google 관리자",
      role: "ADMIN",
      department: "운영팀",
      createdAt: authUser.created_at,
      updatedAt: authUser.updated_at ?? authUser.created_at,
    };

    set({ user: adminUser });
    console.log("[AdminAuth] 현재 활성화된 Admin 세션 동기화 완료:", adminUser);
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