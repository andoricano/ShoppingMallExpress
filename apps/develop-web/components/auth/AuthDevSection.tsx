// @/components/auth/AuthDevSection.tsx
"use client";

import { useState } from "react";
import { UserProfile } from "@mall/types"; // [수정] 공통 타입 적용
import { useAdminAuthStore } from "@/store/useAdminAuth";
import { UserAuthBox } from "./AdminAuthBox";

export function AuthDevSection() {
    // [수정] Admin은 Zustand 스토어 구독
    const {
        user: adminUser,
        signUp: onAdminSignUp,
        signIn: onAdminSignIn,
        googleSignIn: onAdminGoogleSignIn,
        getSession: onAdminGetSession,
        signOut: onAdminSignOut,
        deleteAccount: onAdminDeleteAccount,
    } = useAdminAuthStore();

    // Client 쪽은 차후 useClientAuthStore 붙이기 전까지 임시 상태로 유지
    const [clientUser, setClientUser] = useState<UserProfile | null>(null);

    return (
        <div className="flex flex-col gap-6">
            {/* 타이틀 영역 */}
            <div>
                <h2 className="text-lg font-bold text-white">Auth API & UI Test Section</h2>
                <p className="text-sm text-zinc-400">인증/권한 테스트 영역입니다.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. 관리자(Admin) 인증 박스 (Zustand 스토어연동) */}
                <UserAuthBox
                    type="Admin"
                    user={adminUser}
                    onSignUp={onAdminSignUp}
                    onSignIn={onAdminSignIn}
                    onGoogleSignIn={onAdminGoogleSignIn}
                    onGetSession={onAdminGetSession}
                    onSignOut={onAdminSignOut}
                    onDeleteAccount={onAdminDeleteAccount}
                />

                {/* 2. 일반 유저(Client) 인증 박스 호출 */}
                <UserAuthBox
                    type="Client"
                    user={clientUser}
                    onSignUp={() => console.log("Client 회원가입")}
                    onSignIn={() => console.log("Client 로그인")}
                    onGoogleSignIn={() => console.log("Client Google 로그인")}
                    onGetSession={() => console.log("Client 세션 확인")}
                    onSignOut={() => setClientUser(null)}
                    onDeleteAccount={() => setClientUser(null)}
                />
            </div>
        </div>
    );
}