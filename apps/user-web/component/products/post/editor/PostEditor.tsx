// post/editor/PostEditor.tsx

'use client';

import type { JSONContent } from '@tiptap/core';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

import { EditSection } from './EditSection';
import { PostToolbar } from './PostToolbar';

export type PostEditorProps = {
  initialContent?: JSONContent;

  onSave?: (content: JSONContent) => void;
  onPreview?: (content: JSONContent) => void;
  onPublish?: (content: JSONContent) => void;
};

export function PostEditor({
  initialContent,
  onSave,
  onPreview,
  onPublish,
}: PostEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
    ],
    content: initialContent,
    immediatelyRender: false,
  });

  const handleSave = () => {
    if (!editor) return;

    onSave?.(editor.getJSON());
  };

  const handlePreview = () => {
    if (!editor) return;

    onPreview?.(editor.getJSON());
  };

  const handlePublish = () => {
    if (!editor) return;

    onPublish?.(editor.getJSON());
  };

  const postToolbarItems = [
    {
      text: '저장',
      onClick: handleSave,
    },
    {
      text: '미리보기',
      onClick: handlePreview,
    },
    {
      text: '게시',
      onClick: handlePublish,
    },
  ];

  return (
    <div>
      <PostToolbar items={postToolbarItems} />
      <EditSection editor={editor} />
    </div>
  );
}