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

      // 2. auth.users UUID 기반 profile을 안전하게 초기화/조회
      const {
        data: profile,
        error: dbError,
      } = await supabase
        .rpc("ensure_current_user_profile");

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
      const adminUser = {
        id: profile.id,
        // Authentication email belongs to Supabase Auth, not user_profiles.
        name: profile.name,
        role: "ADMIN",
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        department: profile.department,
      } as UserProfile;

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
