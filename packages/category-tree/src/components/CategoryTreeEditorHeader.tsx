// packages/category-tree/src/components/CategoryTreeEditorHeader.tsx

"use client";

interface CategoryTreeEditorHeaderProps {
    canUndo: boolean;
    canRedo: boolean;
    hasChanges: boolean;

    onSave?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}

export default function CategoryTreeEditorHeader({
    canUndo,
    canRedo,
    hasChanges,
    onSave,
    onUndo,
    onRedo,
}: CategoryTreeEditorHeaderProps) {
    return (
        <header className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
                Category Tree
            </h2>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    되돌리기
                </button>

                <button
                    type="button"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    다시 되돌리기
                </button>

                <button
                    type="button"
                    onClick={onSave}
                    disabled={!hasChanges}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    저장
                </button>
            </div>
        </header>
    );
}