// post/editor/useEditSection.ts

'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import Image from '@tiptap/extension-image';

export function useEditSection(editor: Editor | null) {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

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

    const insertImage = (src: string) => {
        if (!editor) return;

        editor
            .chain()
            .focus()
            .setImage({ src })
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

    return {
        isImageModalOpen,
        isVideoModalOpen,
        isLinkModalOpen,

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