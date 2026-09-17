"use client";

import { useEffect, useRef, useState } from "react";

interface ImageUploadFieldProps {
    label: string;
    imageUrl?: string;
    imageUrls?: string[];
    multiple?: boolean;
    onUpload: (files: File[]) => void;
}

export default function ImageUploadField({
    label,
    imageUrl,
    imageUrls = [],
    multiple = false,
    onUpload,
}: ImageUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [
        selectedFiles,
        setSelectedFiles,
    ] = useState<File[]>([]);

    const [previewUrls, setPreviewUrls] =
        useState<string[]>([]);

    const [isDragging, setIsDragging] =
        useState(false);

    const images = multiple
        ? imageUrls
        : imageUrl
            ? [imageUrl]
            : [];

    useEffect(() => {
        if (selectedFiles.length === 0) {
            setPreviewUrls([]);
            return;
        }

        const urls = selectedFiles.map(
            (file) =>
                URL.createObjectURL(file),
        );

        setPreviewUrls(urls);

        return () => {
            urls.forEach((url) =>
                URL.revokeObjectURL(url),
            );
        };
    }, [selectedFiles]);

    const displayImages =
        previewUrls.length > 0
            ? previewUrls
            : images;

    const handleFiles = (
        files: FileList | null,
    ) => {
        if (!files || files.length === 0) {
            return;
        }

        const nextFiles = Array.from(files);

        const selected = multiple
            ? nextFiles
            : nextFiles.slice(0, 1);

        setSelectedFiles(selected);

        onUpload(selected);
    };

    const handleDrop = (
        event: React.DragEvent<HTMLDivElement>,
    ) => {
        event.preventDefault();
        setIsDragging(false);

        handleFiles(event.dataTransfer.files);
    };

    const handleDragOver = (
        event: React.DragEvent<HTMLDivElement>,
    ) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                {label}
            </label>

            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() =>
                    inputRef.current?.click()
                }
                className={[
                    "cursor-pointer rounded-lg border-2 border-dashed p-4 transition-colors",
                    isDragging
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400",
                ].join(" ")}
            >
                {displayImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {displayImages.map(
                            (url, index) => (
                                <div
                                    key={`${url}-${index}`}
                                    className="aspect-square overflow-hidden rounded-lg bg-white"
                                >
                                    <img
                                        src={url}
                                        alt={`${label} ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ),
                        )}
                    </div>
                ) : (
                    <div className="flex aspect-video items-center justify-center">
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600">
                                이미지를 드래그하세요
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                또는 클릭하여 업로드
                            </p>
                        </div>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple={multiple}
                    className="hidden"
                    onChange={(event) => {
                        handleFiles(
                            event.target.files,
                        );

                        event.target.value = "";
                    }}
                />
            </div>
        </div>
    );
}