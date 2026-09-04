// component/products/post/ProductPostEditor.tsx

"use client";

import type { JSONContent } from "@tiptap/core";
import type { ProductPost } from "@mall/types";

import { ProductPreview } from "./ProductPreview";
import { ProductDescriptionEditor } from "../post/editor/PostEditor";

export type ProductPostEditorMode =
    | "create"
    | "edit";

export interface ProductPostEditorProps {
    mode: ProductPostEditorMode;
    productPost?: ProductPost | null;

    saving?: boolean;

    onCreate?: (
        data: Partial<ProductPost>,
    ) => Promise<ProductPost | undefined>;

    onUpdate?: (
        data: Partial<ProductPost>,
    ) => Promise<ProductPost | undefined>;
}

export function ProductPostEditor({
    mode,
    productPost = null,
    saving = false,
}: ProductPostEditorProps) {
    const currentPost = productPost;

    const handleDescriptionChange = (
        content: JSONContent,
    ) => {
        // ProductPost content 상태 연결 예정
        console.log(content);
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 중앙 - Editor */}
            <div className="space-y-6">
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">
                        상품 게시물 작성
                    </h2>

                    {/* 
                      제목 / 썸네일 / 이미지 / 태그 / 상품 선택
                      등 ProductPost 기본 정보 입력 영역
                    */}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">
                        상세 설명
                    </h2>

                    <ProductDescriptionEditor
                        initialContent={
                            currentPost?.content
                                ? JSON.parse(currentPost.content)
                                : undefined
                        }
                        onChange={handleDescriptionChange}
                    />
                </section>
            </div>

            {/* 우측 - Preview */}
            <div>
                <div className="sticky top-6">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">
                        게시글 미리보기
                    </h2>

                    {currentPost ? (
                        <ProductPreview
                            name={currentPost.title}
                            mainImageUrl={
                                currentPost.thumbnail.imageUrl
                            }
                            imageUrls={currentPost.imageUrls}
                            description={currentPost.content}
                            price={currentPost.thumbnail.price}
                        />
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
                            게시물 미리보기
                        </div>
                    )}
                </div>
            </div>

            {saving && (
                <div className="text-sm text-slate-500 lg:col-span-2">
                    저장 중입니다...
                </div>
            )}
        </div>
    );
}