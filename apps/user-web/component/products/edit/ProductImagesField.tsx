"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One Product image in display order. `url` is either a persisted public URL
 * or, while `file` is set, a temporary `blob:` preview that is uploaded on save.
 */
export interface ProductImageItem {
    url: string;
    file?: File;
}

// Mirrors the `images` bucket contract (20260925110000_images_storage_bucket.sql).
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const smallButton = "rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40";

interface ProductImagesFieldProps {
    value: ProductImageItem[];
    onChange: (value: ProductImageItem[]) => void;
    disabled?: boolean;
}

/** Add / remove / reorder Product images; uploading happens on save. */
export function ProductImagesField({ value, onChange, disabled = false }: ProductImagesFieldProps) {
    const [error, setError] = useState<string | null>(null);
    const previewUrlsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const previewUrls = previewUrlsRef.current;

        return () => {
            previewUrls.forEach((url) => URL.revokeObjectURL(url));
            previewUrls.clear();
        };
    }, []);

    const addFiles = (files: FileList | null) => {
        const selected = Array.from(files ?? []);
        const rejected = selected.filter(
            (file) => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE,
        );
        const accepted = selected.filter((file) => !rejected.includes(file));

        setError(
            rejected.length > 0
                ? "JPEG/PNG/WebP 형식의 5MB 이하 이미지만 추가할 수 있습니다."
                : null,
        );

        if (accepted.length === 0) return;

        onChange([
            ...value,
            ...accepted.map((file) => {
                const url = URL.createObjectURL(file);
                previewUrlsRef.current.add(url);
                return { url, file };
            }),
        ]);
    };

    const remove = (index: number) => {
        const item = value[index];

        if (item?.file) {
            URL.revokeObjectURL(item.url);
            previewUrlsRef.current.delete(item.url);
        }

        onChange(value.filter((_, itemIndex) => itemIndex !== index));
    };

    const move = (from: number, to: number) => {
        if (to < 0 || to >= value.length) return;

        const next = [...value];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item!);
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">상품 이미지</span>
                <label className={`${smallButton} cursor-pointer ${disabled ? "pointer-events-none opacity-40" : ""}`}>
                    이미지 추가
                    <input
                        type="file"
                        accept={ACCEPTED_TYPES.join(",")}
                        multiple
                        disabled={disabled}
                        className="hidden"
                        onChange={(event) => {
                            addFiles(event.target.files);
                            event.target.value = "";
                        }}
                    />
                </label>
            </div>

            {value.length === 0 ? (
                <p className="text-xs text-slate-400">등록된 이미지가 없습니다. 첫 번째 이미지가 대표 이미지로 사용됩니다.</p>
            ) : (
                <ul className="flex flex-wrap gap-3">
                    {value.map((item, index) => (
                        <li key={`${index}:${item.url}`} className="w-28 space-y-1">
                            <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                {/* eslint-disable-next-line @next/next/no-img-element -- blob: previews and Storage URLs */}
                                <img src={item.url} alt={`상품 이미지 ${index + 1}`} className="h-full w-full object-cover" />
                                {index === 0 && (
                                    <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">대표</span>
                                )}
                                {item.file && (
                                    <span className="absolute right-1 top-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">저장 시 업로드</span>
                                )}
                            </div>
                            <div className="flex justify-between gap-1">
                                <button type="button" className={smallButton} disabled={disabled || index === 0} onClick={() => move(index, index - 1)} aria-label="앞으로 이동">←</button>
                                <button type="button" className={smallButton} disabled={disabled} onClick={() => remove(index)}>삭제</button>
                                <button type="button" className={smallButton} disabled={disabled || index === value.length - 1} onClick={() => move(index, index + 1)} aria-label="뒤로 이동">→</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
    );
}
