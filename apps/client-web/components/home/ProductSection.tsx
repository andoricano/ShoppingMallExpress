// components/home/ProductSection.tsx

"use client";

import Link from "next/link";
import type {
  ProductPost,
  ProductSection,
} from "@mall/types";

import { ClientProductPostCard } from "./ClientProductPostCard";

interface ProductSectionProps {
  section: ProductSection;
  posts: ProductPost[];
}

export default function ProductSection({
  section,
  posts,
}: ProductSectionProps) {
  const sectionPosts = section.postIds
    .map((postId) =>
      posts.find(
        (post) => post.id === postId,
      ),
    )
    .filter(
      (post): post is ProductPost =>
        Boolean(post),
    );

  if (sectionPosts.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-20 text-center text-neutral-500">
        등록된 상품 게시물이 없습니다.
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="mb-10 flex items-end justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
          {section.title}
        </h2>

        <Link
          href="/products"
          className="text-sm font-medium text-neutral-900 hover:underline"
        >
          전체보기 →
        </Link>
      </div>

      {/* GRID */}
      {section.layout === "GRID" && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sectionPosts.map((post) => (
            <ClientProductPostCard
              key={post.id}
              post={post}
            />
          ))}
        </div>
      )}

      {/* HORIZONTAL SCROLL */}
      {section.layout ===
        "HORIZONTAL_SCROLL" && (
          <div className="flex gap-6 overflow-x-auto pb-2">
            {sectionPosts.map((post) => (
              <div
                key={post.id}
                className="w-[220px] shrink-0"
              >
                <ClientProductPostCard
                  post={post}
                />
              </div>
            ))}
          </div>
        )}

      {/* LARGE */}
      {section.layout === "LARGE" && (
        <div className="grid grid-cols-1 gap-6">
          {sectionPosts.map((post) => (
            <ClientProductPostCard
              key={post.id}
              post={post}
            />
          ))}
        </div>
      )}
    </section>
  );
}