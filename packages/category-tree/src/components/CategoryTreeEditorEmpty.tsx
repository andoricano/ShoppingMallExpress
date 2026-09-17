// packages/category-tree/src/components/CategoryTreeEditorEmpty.tsx

"use client";

interface CategoryTreeEditorEmptyProps {
    onStart?: () => void;
}

export default function CategoryTreeEditorEmpty({
    onStart,
}: CategoryTreeEditorEmptyProps) {
    return (
        <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8">
            <div className="text-center">
                <h2 className="text-base font-semibold text-slate-900">
                    카테고리를 시작하세요
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                    첫 번째 카테고리를 추가하면
                    카테고리 편집을 시작할 수 있습니다.
                </p>

                <button
                    type="button"
                    onClick={onStart}
                    className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                    시작하기
                </button>
            </div>
        </div>
    );
}