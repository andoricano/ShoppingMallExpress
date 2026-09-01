// post/editor/EditSection.tsx

import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';

import { EditorToolbar } from './EditorToolbar';
import { EditorContent } from './tiptap/EditorContent';

export type EditSectionProps = {
  editor: Editor | null;

  toolbarItems?: {
    text: string;
    icon?: ReactNode;
    onClick: () => void;
  }[];
};

export function EditSection({
  editor,
  toolbarItems = [],
}: EditSectionProps) {
  return (
    <div>
      <EditorToolbar items={toolbarItems} />

      <EditorContent editor={editor} />
    </div>
  );
}