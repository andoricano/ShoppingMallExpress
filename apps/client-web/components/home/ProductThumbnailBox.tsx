// component/products/post/client/ClientProductPostCard.tsx

"use client";

import type { ProductPost } from "@mall/types";
import { ProductPostCard } from "@mall/tiptap";

interface ClientProductPostCardProps {
  post: ProductPost;
}

export function ClientProductPostCard({
  post,
}: ClientProductPostCardProps) {
  return (
    <ProductPostCard
      imageUrl={post.thumbnail.imageUrl}
      title={post.thumbnail.title}
      summary={post.thumbnail.summary}
      discount={post.thumbnail.discount}
      price={post.thumbnail.price}
      tags={post.thumbnail.tags}
    />
  );
}