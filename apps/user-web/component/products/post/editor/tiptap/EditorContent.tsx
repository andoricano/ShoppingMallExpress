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
        <div
            style={{
                minHeight: '500px',
                padding: '16px',
                border: '1px solid #e5e5e5',
                borderRadius: '4px',
            }}
        >
            <TiptapEditorContent
                editor={editor}
            />
        </div>
    );
}