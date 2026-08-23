"use client";

import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { useOrderStore } from "@/store/useOrderStore";

export default function Header() {
  const { cartItems, wishlistIds } = useOrderStore();

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlistIds.length;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold tracking-widest text-neutral-900">
          {SITE_CONFIG.name}
        </Link>

        {/* GNB Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {SITE_CONFIG.mainNav.map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="text-sm font-medium text-neutral-600 hover:text-black transition-colors"
            >
              {nav.title}
            </Link>
          ))}
        </nav>

        {/* Right Utility (Wishlist / Cart) */}
        <div className="flex items-center gap-6">
          <Link
            href="/order/wishlist"
            className="text-sm font-medium text-neutral-700 hover:text-black flex items-center gap-1.5"
          >
            Wishlist
            {wishlistCount > 0 && (
              <span className="bg-neutral-100 text-neutral-900 text-xs font-bold px-2 py-0.5 rounded-full">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/order/cart"
            className="text-sm font-medium text-neutral-700 hover:text-black flex items-center gap-1.5"
          >
            Cart
            {cartCount > 0 && (
              <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}