// post/editor/useEditSection.ts

"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";
import type { Editor } from "@tiptap/react";

export interface PendingImage {
    file: File;
    previewUrl: string;
}

export function useEditSection(
    editor: Editor | null,
) {
    const [isImageModalOpen, setIsImageModalOpen] =
        useState(false);

    const [isVideoModalOpen, setIsVideoModalOpen] =
        useState(false);

    const [isLinkModalOpen, setIsLinkModalOpen] =
        useState(false);

    const [imageFiles, setImageFiles] =
        useState<PendingImage[]>([]);

    const previewUrlsRef =
        useRef<string[]>([]);

    const openImageModal = () => {
        setIsImageModalOpen(true);
    };

    const closeImageModal = () => {
        setIsImageModalOpen(false);
    };

    const openVideoModal = () => {
        setIsVideoModalOpen(true);
    };

    const closeVideoModal = () => {
        setIsVideoModalOpen(false);
    };

    const openLinkModal = () => {
        setIsLinkModalOpen(true);
    };

    const closeLinkModal = () => {
        setIsLinkModalOpen(false);
    };

    const insertImage = (file: File) => {
        if (!editor) {
            return;
        }

        const previewUrl =
            URL.createObjectURL(file);

        previewUrlsRef.current.push(
            previewUrl,
        );

        setImageFiles((current) => [
            ...current,
            {
                file,
                previewUrl,
            },
        ]);

        editor
            .chain()
            .focus()
            .setImage({
                src: previewUrl,
            })
            .run();

        closeImageModal();
    };

    const insertHorizontalRule = () => {
        if (!editor) {
            return;
        }

        editor
            .chain()
            .focus()
            .setHorizontalRule()
            .run();
    };

    const insertLink = (href: string) => {
        if (!editor) {
            return;
        }

        editor
            .chain()
            .focus()
            .setLink({ href })
            .run();

        closeLinkModal();
    };

    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach(
                (url) => {
                    URL.revokeObjectURL(url);
                },
            );

            previewUrlsRef.current = [];
        };
    }, []);

    return {
        isImageModalOpen,
        isVideoModalOpen,
        isLinkModalOpen,

        imageFiles,

        openImageModal,
        closeImageModal,

        openVideoModal,
        closeVideoModal,

        openLinkModal,
        closeLinkModal,

        insertImage,
        insertHorizontalRule,
        insertLink,
    };
}