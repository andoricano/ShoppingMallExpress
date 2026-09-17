// packages/category-tree/src/components/CategoryTreeEditorHeader.tsx

"use client";

type SaveStatus =
    | "saving"
    | "saved"
    | "editing"
    | null;

interface CategoryTreeEditorHeaderProps {
    canUndo: boolean;
    canRedo: boolean;
    hasChanges: boolean;

    saveStatus?: SaveStatus;

    onSave?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}

export default function CategoryTreeEditorHeader({
    canUndo,
    canRedo,
    hasChanges,
    saveStatus,
    onSave,
    onUndo,
    onRedo,
}: CategoryTreeEditorHeaderProps) {
    const statusText =
        saveStatus === "saving"
            ? "저장안됨"
            : hasChanges
                ? "편집중"
                : saveStatus === "saved"
                    ? "저장완료"
                    : "";

    return (
        <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-slate-900">
                    Category Tree
                </h2>
                {statusText && (
                    <span
                        className={[
                            "rounded-md border px-2 py-1 text-xs font-medium",
                            saveStatus === "saving"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : saveStatus === "saved"
                                    ? "border-sky-200 bg-sky-50 text-sky-700"
                                    : "border-slate-200 bg-slate-50 text-slate-500",
                        ].join(" ")}
                    >
                        {statusText}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="cursor-pointer rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    되돌리기
                </button>

                <button
                    type="button"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="cursor-pointer rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    다시 되돌리기
                </button>

                <button
                    type="button"
                    onClick={onSave}
                    disabled={!hasChanges || saveStatus === "saving"}
                    className={[
                        "rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors",
                        hasChanges &&
                            saveStatus !== "saving"
                            ? "cursor-pointer hover:bg-slate-800"
                            : "cursor-not-allowed opacity-40",
                    ].join(" ")}
                >
                    저장
                </button>
            </div>
        </header>
    );
}