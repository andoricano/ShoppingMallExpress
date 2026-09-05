// component/products/post/ProductPostDescription.tsx

import { TiptapViewer } from "@mall/tiptap";

interface ProductPostDescriptionProps {
    description: string;
}

export function ProductPostDescription({
    description,
}: ProductPostDescriptionProps) {
    if (!description) {
        return null;
    }

    return (
        <section className="w-full py-16">
            <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 2xl:max-w-6xl">
                <h2 className="mb-8 text-2xl font-bold text-slate-900">
                    상품 상세 설명
                </h2>

                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <TiptapViewer content={description} />
                </div>
            </div>
        </section>
    );
}