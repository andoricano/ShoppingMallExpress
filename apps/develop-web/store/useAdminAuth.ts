// apps/develop-web/store/useAdminAuth.ts
import { create } from "zustand";
import { ClientProfile, CreateUserInput, UserProfile } from "@mall/types";
import { createClient } from "../lib/supabase/client";
import { Provider } from "@supabase/supabase-js";

export type OAuthProvider = "google" | "kakao" | "facebook";

interface AdminAuthState {
  user: UserProfile | null;
  thirdPartySignIn: (provider: OAuthProvider) => Promise<void>;
  getSession: () => Promise<void>;
  completeOnboarding: (input: CreateUserInput) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,

  thirdPartySignIn: async (provider: OAuthProvider) => {
    const supabase = createClient();
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
    console.log("[AdminAuth] 세션 확인 시도");
    const supabase = createClient();

    // 1. 세션 존재 여부 우선 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.log("[AdminAuth] 로그인 안 됨 (세션 없음)", sessionError?.message);
      set({ user: null });
      return;
    }

    // Auth 세션 정보 확인
    console.log("[AdminAuth] 1. Auth Session 유저:", {
      id: session.user.id,
      email: session.user.email,
      user_metadata: session.user.user_metadata,
    });

    // 2. public.users 테이블에서 해당 유저의 DB 프로필 조회
    const { data: profile, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (dbError || !profile) {
      console.error("[AdminAuth] DB 프로필 조회 실패:", dbError);
      set({ user: null });
      return;
    }

    // DB 원본 프로필 데이터 확인
    console.log("[AdminAuth] 2. DB Profile 원본:", profile);

    // 3. 주소 정보 객체 안전하게 생성
    const hasAddressInfo = Boolean(profile.zonecode && profile.address);
    const addressData = hasAddressInfo
      ? {
        zonecode: profile.zonecode ?? "",
        address: profile.address ?? "",
        detail: profile.address_detail ?? "",
      }
      : undefined;

    // 4. ClientProfile 객체 생성 및 Zustand 상태 세팅
    const clientUser: ClientProfile = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role ?? "CLIENT",
      recipientName: profile.recipient_name,
      phone: profile.phone,
      address: addressData,
      isOnboarded: profile.is_onboarded ?? false,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    // 최종 Zustand 매핑 상태 확인
    console.log("[AdminAuth] 3. Zustand 최종 매핑 객체:", clientUser);

    set({ user: clientUser });
    console.log("[AdminAuth] 로그인 및 프로필 로드 완료");
  },

  

  completeOnboarding: async (input: CreateUserInput) => {
    console.log("[AdminAuth] 온보딩 제출 시도:", input);
    const supabase = createClient();

    // Supabase RPC 호출
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
      console.error("[AdminAuth] 온보딩 실패:", error.message);
      throw new Error(error.message);
    }

    console.log("[AdminAuth] 온보딩 완료. 세션 정보 갱신 중...");

    // 온보딩 완료 후 유저 상태 다시 로드
    await get().getSession();
  },

  signOut: async () => {
    console.log("[AdminAuth] 로그아웃(SignOut) 시도");
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[AdminAuth] 로그아웃 실패:", error.message);
    }

    set({ user: null });
    console.log("[AdminAuth] Admin 세션 클리어 완료");
  },

  deleteAccount: async () => {
    console.log("[AdminAuth] 회원탈퇴(DeleteAccount) 버튼 클릭됨");
    const supabase = createClient();

    await supabase.auth.signOut();
    set({ user: null });
    console.log("[AdminAuth] Admin 계정 세션 제거 완료");
  },
}));