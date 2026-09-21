import { create } from "zustand";
import { CreateUserInput, UserProfile } from "@mall/types";
import { createClient } from "../lib/supabase/client";
import { Provider } from "@supabase/supabase-js";

export type OAuthProvider = "google" | "kakao" | "facebook";

interface AdminAuthState {
  authInitialized: boolean;
  user: UserProfile | null;
  thirdPartySignIn: (provider: OAuthProvider) => Promise<void>;
  getSession: () => Promise<void>;
  completeOnboarding: (input: CreateUserInput) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  authInitialized: false,
  user: null,
  thirdPartySignIn: async (provider: OAuthProvider) => {
    const supabase = createClient();

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo:
            `${window.location.origin}/auth/callback?next=/`,
        },
      });

    if (error) {
      console.error(
        `[AdminAuth] ${provider} 로그인 실패:`,
        error.message,
      );
    }
  },
  getSession: async () => {
    const supabase = createClient();

    try {
      // 1. 세션 존재 여부 우선 확인
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        set({
          user: null,
        });

        return;
      }

      // 2. public.users 테이블에서 해당 유저의 DB 프로필 조회
      const {
        data: profile,
        error: dbError,
      } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (dbError || !profile) {
        set({
          user: null,
        });

        return;
      }

      // 3. 관리자 권한 체크
      if (profile.role !== "ADMIN") {
        await supabase.auth.signOut();

        set({
          user: null,
        });

        return;
      }

      // 4. UserProfile 매핑
      const adminUser: UserProfile = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };

      set({
        user: adminUser,
      });

    } finally {
      set({
        authInitialized: true,
      });
    }
  },

  completeOnboarding: async (input: CreateUserInput) => {
    const supabase = createClient();

    const { error } = await supabase.rpc("complete_onboarding", {
      p_recipient_name: input.recipientName,
      p_phone: input.phone,
      p_zonecode: input.zonecode,
      p_address: input.address,
      p_address_detail: input.addressDetail,
      p_terms_agreed: input.termsAgreed,
      p_marketing_agreed: input.marketingAgreed ?? false,
    });

    if (error) {
      throw new Error(error.message);
    }

    await get().getSession();
  },

  signOut: async () => {
    const supabase = createClient();

    await supabase.auth.signOut();

    set({ user: null });
  },

  deleteAccount: async () => {
    const supabase = createClient();

    await supabase.auth.signOut();
    set({ user: null });
  },
}));
