// post/editor/modal/ImageUploaderModal.tsx

"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ImageUploaderModalProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (file: File) => void;
};

export function ImageUploaderModal({
    open,
    onClose,
    onSubmit,
}: ImageUploaderModalProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    if (!open) {
        return null;
    }

    const handleFile = (nextFile: File | undefined) => {
        if (!nextFile) {
            return;
        }

        if (!nextFile.type.startsWith("image/")) {
            return;
        }

        setFile(nextFile);
    };

    const handleDrop = (
        event: React.DragEvent<HTMLDivElement>,
    ) => {
        event.preventDefault();
        setIsDragging(false);

        handleFile(event.dataTransfer.files[0]);
    };

    const handleSubmit = () => {
        if (!file) {
            return;
        }

        onSubmit(file);
        setFile(null);
        onClose();
    };

    const handleClose = () => {
        setFile(null);
        setIsDragging(false);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                        이미지 추가
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        이미지를 드래그하거나 클릭하여 선택하세요.
                    </p>
                </div>

                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => {
                        setIsDragging(false);
                    }}
                    onDrop={handleDrop}
                    className={[
                        "flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                        isDragging
                            ? "border-blue-400 bg-blue-50"
                            : "border-slate-300 bg-slate-50 hover:border-slate-400",
                    ].join(" ")}
                >
                    {file ? (
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-700">
                                {file.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                이미지를 변경하려면 다시 클릭하세요.
                            </p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600">
                                이미지를 드래그하세요
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                또는 클릭하여 선택
                            </p>
                        </div>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                            handleFile(event.target.files?.[0])
                        }
                    />
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        취소
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!file}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        추가
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}