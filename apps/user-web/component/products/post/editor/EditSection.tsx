// post/editor/EditSection.tsx

import type { Editor } from '@tiptap/react';

import { EditorToolbar } from './EditorToolbar';
import { EditorContent } from './tiptap/EditorContent';
import { ImageUploaderModal } from './modal/ImageUploaderModal';
import { useEditSection } from './useEditSection';

export type EditSectionProps = {
  editor: Editor | null;
};

export function EditSection({
  editor,
}: EditSectionProps) {
  const {
    isImageModalOpen,
    openImageModal,
    closeImageModal,
    insertImage,

    openVideoModal,
    openLinkModal,
    insertHorizontalRule,
  } = useEditSection(editor);

  const toolbarItems = [
    {
      text: '이미지',
      onClick: openImageModal,
    },
    {
      text: '영상',
      onClick: openVideoModal,
    },
    {
      text: '링크',
      onClick: openLinkModal,
    },
    {
      text: '구분선',
      onClick: insertHorizontalRule,
    },
  ];

  return (
    <div>
      <EditorToolbar items={toolbarItems} />

      <EditorContent editor={editor} />

      <ImageUploaderModal
        open={isImageModalOpen}
        onClose={closeImageModal}
        onSubmit={insertImage}
      />
    </div>
  );
}