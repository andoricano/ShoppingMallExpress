// post/editor/EditSection.tsx

import type { Editor } from "@tiptap/react";

import { EditorToolbar } from "./EditorToolbar";
import { EditorContent } from "./tiptap/EditorContent";
import { ImageUploaderModal } from "./modal/ImageUploaderModal";
import { useEditSection } from "./useEditSection";

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

  return (
    <div>
      <EditorToolbar
        editor={editor}
        onImage={openImageModal}
        onVideo={openVideoModal}
        onLink={openLinkModal}
        onHorizontalRule={insertHorizontalRule}
      />

      <EditorContent editor={editor} />

      <ImageUploaderModal
        open={isImageModalOpen}
        onClose={closeImageModal}
        onSubmit={insertImage}
      />
    </div>
  );
}