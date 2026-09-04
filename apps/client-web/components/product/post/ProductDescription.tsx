// component/products/post/ProductDescription.tsx

import { TiptapViewer } from "@mall/tiptap";

interface ProductDescriptionProps {
    description: string;
}

export function ProductDescription({
    description,
}: ProductDescriptionProps) {
    if (!description) {
        return null;
    }

    return (
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
                상품 상세 설명
            </h2>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
                <TiptapViewer content={description} />
            </div>
        </section>
    );
}