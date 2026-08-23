"use client";

import Link from "next/link";

interface UserAuthActionProps {
  isLoggedIn?: boolean;
  cartItemCount?: number;
  onLogout?: () => void;
}

export default function UserAuthAction({
  isLoggedIn = false,
  cartItemCount = 0,
  onLogout,
}: UserAuthActionProps) {
  if (isLoggedIn) {
    return (
      <div className="flex items-center space-x-6 text-sm font-medium text-neutral-700">
        {/* 장바구니 (로그인 시에만 노출) */}
        <Link
          href="/cart"
          className="relative inline-flex items-center hover:text-black transition-colors"
        >
          <span>장바구니</span>
          {cartItemCount > 0 && (
            <span className="ml-1.5 bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {cartItemCount}
            </span>
          )}
        </Link>

        <span className="text-neutral-200">|</span>

        <Link href="/mypage" className="hover:text-black transition-colors">
          마이페이지
        </Link>

        <button
          onClick={onLogout}
          className="text-neutral-500 hover:text-black transition-colors text-xs"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 text-sm font-medium">
      <Link
        href="/login"
        className="text-neutral-700 hover:text-black transition-colors px-2 py-1"
      >
        로그인
      </Link>
      <Link
        href="/signup"
        className="bg-neutral-900 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold hover:bg-neutral-800 transition-colors"
      >
        회원가입
      </Link>
    </div>
  );
}