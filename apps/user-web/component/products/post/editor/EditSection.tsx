// post/editor/EditSection.tsx

import { useEffect } from "react";
import type { Editor } from "@tiptap/react";

import { EditorToolbar } from "./EditorToolbar";
import { EditorContent } from "./tiptap/EditorContent";
import { ImageUploaderModal } from "./modal/ImageUploaderModal";
import {
  useEditSection,
  type PendingImage,
} from "./useEditSection";

export type EditSectionProps = {
  editor: Editor | null;
  onImagesChange?: (
    images: PendingImage[],
  ) => void;
};

export function EditSection({
  editor,
  onImagesChange,
}: EditSectionProps) {
  const {
    isImageModalOpen,
    openImageModal,
    closeImageModal,
    insertImage,
    openVideoModal,
    openLinkModal,
    insertHorizontalRule,
    imageFiles,
  } = useEditSection(editor);

  useEffect(() => {
    onImagesChange?.(imageFiles);
  }, [imageFiles, onImagesChange]);

  return (
    <div>
      <EditorToolbar
        editor={editor}
        onImage={openImageModal}
        onVideo={openVideoModal}
        onLink={openLinkModal}
        onHorizontalRule={
          insertHorizontalRule
        }
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