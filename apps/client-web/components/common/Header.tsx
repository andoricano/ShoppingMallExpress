"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMallConfigStore } from "@/store/useMallConfigStore";
import UserAuthAction from "./UserAuthAction";

export default function Header() {
  const { config, fetchMallConfig } = useMallConfigStore();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // 💡 추후 useAuthStore 연결 지점
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    fetchMallConfig();
  }, [fetchMallConfig]);

  const categories = config.categories;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 1. 좌측: 로고 */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold tracking-wider text-neutral-900">
              MALL
            </Link>
          </div>

          {/* 2. 중앙: Category Navigation */}
          <nav className="hidden md:flex space-x-8">
            {categories.map((category) => (
              <div
                key={category.categoryId}
                className="relative group py-5"
                onMouseEnter={() => setHoveredCategory(category.categoryId)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  href={`/products?categoryId=${category.categoryId}`}
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  {category.categoryName}
                </Link>

                {category.children && category.children.length > 0 && hoveredCategory === category.categoryId && (
                  <div className="absolute top-full left-0 w-48 bg-white border border-neutral-100 shadow-lg rounded-b-md py-2 z-10">
                    {category.children.map((subCategory) => (
                      <Link
                        key={subCategory.categoryId}
                        href={`/products?categoryId=${subCategory.categoryId}`}
                        className="block px-4 py-2 text-xs text-neutral-600 hover:bg-neutral-50 transition-colors"
                      >
                        {subCategory.categoryName}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* 3. 우측: Auth / User Menu */}
          <UserAuthAction
            isLoggedIn={isLoggedIn}
            cartItemCount={cartItemCount}
            onLogout={() => setIsLoggedIn(false)}
          />
        </div>
      </div>
    </header>
  );
}