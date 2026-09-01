// post/editor/usePostEditor.ts

'use client';

import type { JSONContent } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function usePostEditor(
    initialContent?: JSONContent,
) {
    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: initialContent,
        immediatelyRender: false,
    });

    return editor;
}