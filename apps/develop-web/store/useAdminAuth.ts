// src/stores/useAdminAuthStore.ts
import { create } from "zustand";
import { AdminProfile, UserProfile } from "@mall/types";

interface AdminAuthState {
  user: UserProfile | null; 
  // 핸들러 함수들
  signUp: () => void;
  signIn: () => void;
  googleSignIn: () => void;
  getSession: () => void;
  signOut: () => void;
  deleteAccount: () => void;
}

const MOCK_ADMIN_USER: AdminProfile = {
  id: "admin-uuid-1234",
  email: "admin@mall.com",
  name: "최고관리자",
  role: "ADMIN",
  department: "운영팀",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,

  signUp: () => {
    console.log("[AdminAuth] 회원가입(SignUp) 버튼 클릭됨");
    set({ user: MOCK_ADMIN_USER });
    console.log("[AdminAuth] Mock Admin 계정 생성 및 로그인 완료:", MOCK_ADMIN_USER);
  },

  signIn: () => {
    console.log("[AdminAuth] 로그인(SignIn) 버튼 클릭됨");
    set({ user: MOCK_ADMIN_USER });
    console.log("[AdminAuth] Admin 로그인 성공 상태 반영:", MOCK_ADMIN_USER);
  },

  googleSignIn: () => {
    console.log("[AdminAuth] Google 로그인(GoogleSignIn) 버튼 클릭됨");
    set({ user: { ...MOCK_ADMIN_USER, name: "Google 관리자" } });
    console.log("[AdminAuth] Admin Google 로그인 완료");
  },

  getSession: () => {
    console.log("[AdminAuth] 세션 확인(GetSession) 버튼 클릭됨");
    const currentUser = get().user;
    if (currentUser) {
      console.log("[AdminAuth] 현재 활성화된 Admin 세션:", currentUser);
    } else {
      console.log("[AdminAuth] 현재 세션 없음 (Unauthenticated)");
    }
  },

  signOut: () => {
    console.log("[AdminAuth] 로그아웃(SignOut) 버튼 클릭됨");
    set({ user: null });
    console.log("[AdminAuth] Admin 세션 클리어 완료");
  },

  deleteAccount: () => {
    console.log("[AdminAuth] 회원탈퇴(DeleteAccount) 버튼 클릭됨");
    set({ user: null });
    console.log("[AdminAuth] Admin 계정 삭제 및 세션 제거 완료");
  },
}));