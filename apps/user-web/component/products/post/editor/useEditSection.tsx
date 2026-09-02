// post/editor/useEditSection.ts

'use client';

import { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';

export function useEditSection(editor: Editor | null) {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // 에디터에 삽입했지만 아직 Cloudinary에 업로드하지 않은 이미지
    const [imageFiles, setImageFiles] = useState<File[]>([]);

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
        if (!editor) return;

        const previewUrl = URL.createObjectURL(file);

        setImageFiles((prev) => [
            ...prev,
            file,
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
        if (!editor) return;

        editor
            .chain()
            .focus()
            .setHorizontalRule()
            .run();
    };

    const insertLink = (href: string) => {
        if (!editor) return;

        editor
            .chain()
            .focus()
            .setLink({ href })
            .run();

        closeLinkModal();
    };

    // 컴포넌트 종료 시 object URL 정리
    useEffect(() => {
        return () => {
            imageFiles.forEach((file) => {
                // 현재 구조에서는 File -> object URL 매핑을 별도로
                // 관리하지 않으므로 실제 URL revoke는 다음 단계에서 처리
                void file;
            });
        };
    }, [imageFiles]);

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