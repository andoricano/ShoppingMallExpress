"use client";
import { useCallback, useState } from "react";
import type { Product, ProductPost } from "@mall/types";
import { useImageApi } from "../images/useImageApi";
import type { PendingImage } from "@/component/products/post/editor/useEditSection";

const emptyPost = (): ProductPost => ({ id: "", title: "", slug: null, summary: null, content: {}, thumbnailUrl: null, status: "DRAFT", publishedAt: null, createdAt: "", updatedAt: "" });
export function useProductPostAdd() {
    const [draftPost, setDraftPost] = useState<ProductPost>(emptyPost);
    const [draftProducts, setDraftProducts] = useState<Product[]>([]);
    const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null); const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const { uploadImage, uploadContentImages } = useImageApi();
    const updatePost = useCallback((post: ProductPost) => setDraftPost(post), []);
    const addProduct = useCallback((product: Product) => setDraftProducts((items) => items.some((item) => item.id === product.id) ? items : [...items, product]), []);
    const updateProduct = useCallback((product: Product) => setDraftProducts((items) => items.map((item) => item.id === product.id ? product : item)), []);
    const removeProduct = useCallback((id: string) => setDraftProducts((items) => items.filter((item) => item.id !== id)), []);
    const moveProduct = useCallback((from: number, to: number) => setDraftProducts((items) => { const next = [...items]; const [item] = next.splice(from, 1); if (item) next.splice(to, 0, item); return next; }), []);
    const createProductPost = useCallback(async (status: ProductPost["status"] = draftPost.status) => { setSaving(true); setError(null); try { let thumbnailUrl = draftPost.thumbnailUrl; if (thumbnailFile) { const uploaded = await uploadImage(thumbnailFile); thumbnailUrl = uploaded.imageUrl; } const content = await uploadContentImages(draftPost.content, pendingImages); const response = await fetch("/api/admin/product-posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draftPost, status, content, thumbnailUrl, productIds: draftProducts.map((item) => item.id) }) }); if (!response.ok) throw new Error("상품 게시물 저장에 실패했습니다."); } catch (cause) { setError(cause instanceof Error ? cause.message : "상품 게시물 저장에 실패했습니다."); throw cause; } finally { setSaving(false); } }, [draftPost, draftProducts, pendingImages, thumbnailFile, uploadContentImages, uploadImage]);
    return { draftPost, draftProducts, updatePost, addProduct, updateProduct, removeProduct, moveProduct, createProductPost, saving, error, thumbnailFile, setThumbnailFile, pendingImages, setPendingImages };
}
