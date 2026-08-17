// @/components/auth/AuthDevSection.tsx
"use client";

import { useState } from "react";
import { AuthUser, UserAuthBox } from "./AdminAuthBox";

export function AuthDevSection() {
    // [수정] 관리자 및 클라이언트 유저 상태 (기본값 null)
    const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
    const [clientUser, setClientUser] = useState<AuthUser | null>(null);

    return (
        <div className="flex flex-col gap-6">
            {/* 타이틀 영역 */}
            <div>
                <h2 className="text-lg font-bold text-white">Auth API & UI Test Section</h2>
                <p className="text-sm text-zinc-400">인증/권한 테스트 영역입니다.</p>
            </div>

            {/* [수정] 2열 Grid로 Admin용, Client용 UserAuthBox 호출 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. 관리자(Admin) 인증 박스 호출 */}
                <UserAuthBox
                    type="Admin"
                    user={adminUser}
                    onSignUp={() => console.log("Admin 회원가입")}
                    onSignIn={() => setAdminUser({ id: "admin-1", email: "admin@test.com", role: "admin" })}
                    onGoogleSignIn={() => console.log("Admin Google 로그인")}
                    onGetSession={() => console.log("Admin 세션 확인")}
                    onSignOut={() => setAdminUser(null)}
                    onDeleteAccount={() => setAdminUser(null)}
                />

                {/* 2. 일반 유저(Client) 인증 박스 호출 */}
                <UserAuthBox
                    type="Client"
                    user={clientUser}
                    onSignUp={() => console.log("Client 회원가입")}
                    onSignIn={() => setClientUser({ id: "user-1", email: "user@test.com", role: "authenticated" })}
                    onGoogleSignIn={() => console.log("Client Google 로그인")}
                    onGetSession={() => console.log("Client 세션 확인")}
                    onSignOut={() => setClientUser(null)}
                    onDeleteAccount={() => setClientUser(null)}
                />
            </div>
        </div>
    );
}