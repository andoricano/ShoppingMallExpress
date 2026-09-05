// component/products/post/client/ClientProductPostCard.tsx

"use client";

import Link from "next/link";
import type { ProductPost } from "@mall/types";
import { ProductPostCard } from "@mall/tiptap";

interface ClientProductPostCardProps {
  post: ProductPost;
}

export function ClientProductPostCard({
  post,
}: ClientProductPostCardProps) {
  return (
    <Link
      href={`/products/${post.id}`}
      className="block"
    >
      <ProductPostCard
        imageUrl={post.thumbnail.imageUrl}
        title={post.thumbnail.title}
        summary={post.thumbnail.summary}
        discount={post.thumbnail.discount}
        price={post.thumbnail.price}
        tags={post.thumbnail.tags}
      />
    </Link>
  );
}