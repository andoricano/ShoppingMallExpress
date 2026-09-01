// component/products/post/editor/tiptap/EditorContent.tsx

'use client';

import type { Editor } from '@tiptap/react';
import {
    EditorContent as TiptapEditorContent,
} from '@tiptap/react';

export type EditorContentProps = {
    editor: Editor | null;
};

export function EditorContent({
    editor,
}: EditorContentProps) {
    if (!editor) {
        return null;
    }

    return (
        <TiptapEditorContent
            editor={editor}
        />
    );
}