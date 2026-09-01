// app/products/post/page.tsx

'use client';

import { useState } from 'react';
import type { JSONContent } from '@tiptap/core';

import { PostEditor } from '@/component/products/post/editor/PostEditor';

export default function Page() {
    const [preview, setPreview] = useState<JSONContent | null>(null);

    const handleSave = (content: JSONContent) => {
        console.log('[PostEditor] 저장', content);
    };

    const handlePreview = (content: JSONContent) => {
        console.log('[PostEditor] 미리보기', content);
        setPreview(content);
    };

    const handlePublish = (content: JSONContent) => {
        console.log('[PostEditor] 게시', content);
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                minHeight: '100vh',
            }}
        >
            {/* Editor */}
            <div
                style={{
                    borderRight: '1px solid #ddd',
                    padding: '24px',
                    overflowY: 'auto',
                }}
            >
                <h2>Editor</h2>

                <PostEditor
                    onSave={handleSave}
                    onPreview={handlePreview}
                    onPublish={handlePublish}
                />
            </div>

            {/* Preview */}
            <div
                style={{
                    padding: '24px',
                    overflowY: 'auto',
                }}
            >
                <h2>Preview</h2>

                {preview ? (
                    <pre
                        style={{
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {JSON.stringify(preview, null, 2)}
                    </pre>
                ) : (
                    <p>미리보기 버튼을 눌러주세요.</p>
                )}
            </div>
        </div>
    );
}