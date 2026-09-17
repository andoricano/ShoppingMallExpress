// component/post/category/PostCategoryEditorToolbar.tsx

"use client";

interface PostCategoryEditorToolbarProps {
    hasChanges: boolean;
    onSave?: () => void;
}

export default function PostCategoryEditorToolbar({
    hasChanges,
    onSave,
}: PostCategoryEditorToolbarProps) {
    return (
        <header className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
                게시물 카테고리
            </h2>

            <button
                type="button"
                onClick={onSave}
                disabled={!hasChanges}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
                저장
            </button>
        </header>
    );
}