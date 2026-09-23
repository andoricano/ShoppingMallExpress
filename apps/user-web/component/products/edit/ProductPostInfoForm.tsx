"use client";

import { useState } from "react";
import type { ProductPost } from "@mall/types";
import FormField from "@/component/common/field/FormField";
import ImageUploadField from "@/component/common/field/ImageUploadField";

export type ProductPostInfoFormProps = { post: ProductPost; onChange: (post: ProductPost) => void; onThumbnailSelect: (file: File) => void };

export function ProductPostInfoForm({ post, onChange, onThumbnailSelect }: ProductPostInfoFormProps) {
    const [error, setError] = useState<string | null>(null);
    return <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">게시물 정보</h2>
        <FormField label="게시물 제목" value={post.title} onChange={(title) => onChange({ ...post, title })} placeholder="게시물 제목을 입력하세요." />
        <FormField label="요약" value={post.summary ?? ""} onChange={(summary) => onChange({ ...post, summary })} placeholder="게시물 요약을 입력하세요." />
        <ImageUploadField label="썸네일 이미지" imageUrl={post.thumbnailUrl ?? undefined} onUpload={(files) => files[0] && onThumbnailSelect(files[0])} />
        {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <button type="button" onClick={() => setError(null)} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">반영하기</button>
    </section>;
}
