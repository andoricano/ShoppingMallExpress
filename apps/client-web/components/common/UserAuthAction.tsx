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
        {/* 장바구니 */}
        <Link
          href="/cart"
          className="relative inline-flex items-center transition-colors hover:text-black"
        >
          <span>장바구니</span>

          {cartItemCount > 0 && (
            <span className="ml-1.5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {cartItemCount}
            </span>
          )}
        </Link>

        <span className="text-neutral-200">|</span>

        {/* 마이페이지 */}
        <Link
          href="/mypage"
          className="transition-colors hover:text-black"
        >
          마이페이지
        </Link>

        {/* 로그아웃 */}
        <button
          type="button"
          onClick={onLogout}
          className="text-xs text-neutral-500 transition-colors hover:text-black"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 text-sm font-medium">
      <Link
        href="/auth"
        className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
      >
        Google 로그인
      </Link>
    </div>
  );
}