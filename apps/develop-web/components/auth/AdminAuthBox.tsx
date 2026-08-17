// @/components/auth/UserAuthBox.tsx
"use client";

import { AuthButton } from "./AuthButton";

// [수정] 유저 데이터 타입 정의
export interface AuthUser {
    id: string;
    email: string;
    name?: string;
    role: string;
}

// [수정] UserAuthBox Props (type: "Client" | "Admin" 추가)
interface UserAuthBoxProps {
    type: "Client" | "Admin";
    user: AuthUser | null;
    onSignUp: () => void;
    onSignIn: () => void;
    onGoogleSignIn: () => void;
    onGetSession: () => void;
    onSignOut: () => void;
    onDeleteAccount: () => void;
}

export function UserAuthBox({
    type,
    user,
    onSignUp,
    onSignIn,
    onGoogleSignIn,
    onGetSession,
    onSignOut,
    onDeleteAccount,
}: UserAuthBoxProps) {
    // [수정] type(Client/Admin)에 따른 UI 테마 설정
    const isAdmin = type === "Admin";

    const badgeStyle = isAdmin
        ? "text-blue-400 bg-blue-950/60 border-blue-800/50"
        : "text-emerald-400 bg-emerald-950/60 border-emerald-800/50";

    const roleTextStyle = isAdmin
        ? "text-blue-400 font-bold"
        : "text-emerald-400 font-bold";

    return (
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col gap-5">
            {/* [수정] 상단 헤더 (type에 따른 뱃지 및 타이틀 변경) */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
                        {type.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                        {isAdmin ? "관리자" : "일반 유저"} 인증 테스트
                    </h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                    Status: {user ? "Authenticated" : "Unauthenticated"}
                </span>
            </div>

            {/* [수정] 유저 정보 박스 (빈 와꾸 유지) */}
            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex flex-col gap-2 text-xs font-mono">
                <div className="flex justify-between">
                    <span className="text-zinc-500">ID:</span>
                    <span className={user?.id ? "text-zinc-200" : "text-zinc-600"}>
                        {user?.id || "null"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Email:</span>
                    <span className={user?.email ? "text-zinc-200" : "text-zinc-600"}>
                        {user?.email || "null"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Name:</span>
                    <span className={user?.name ? "text-zinc-200" : "text-zinc-600"}>
                        {user?.name || "null"}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Role:</span>
                    <span className={user?.role ? roleTextStyle : "text-zinc-600"}>
                        {user?.role || "guest"}
                    </span>
                </div>
            </div>

            {/* 2x3 버튼 영역 (동일 구성 유지) */}
            <div className="grid grid-cols-3 gap-2">
                <AuthButton label="1. 회원가입" onClick={onSignUp} />
                <AuthButton label="2. 로그인" onClick={onSignIn} />
                <AuthButton label="3. Google 로그인" onClick={onGoogleSignIn} variant="primary" />
                <AuthButton label="4. 세션 확인" onClick={onGetSession} />
                <AuthButton label="5. 로그아웃" onClick={onSignOut} />
                <AuthButton label="6. 탈퇴" onClick={onDeleteAccount} variant="danger" />
            </div>
        </div>
    );
}