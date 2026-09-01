// post/editor/PostEditor.tsx

'use client';

import type { JSONContent } from '@tiptap/core';

import { PostToolbar } from './PostToolbar';
import { EditSection } from './EditSection';
import { usePostEditor } from './usePostEditor';

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
  const editor = usePostEditor(initialContent);

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