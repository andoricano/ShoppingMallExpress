// post/editor/Editor.tsx

import type { ReactNode } from 'react';
import type { PostBlock } from '../PostType';

import { EditorToolbar } from './EditorToolbar';
import { EditorBlock } from './block/EditorBlock';

export type EditorProps = {
  blocks: PostBlock[];

  // 개별 Block이 수정됐을 때 전달
  onChange: (block: PostBlock) => void;

  toolbarItems: {
    text: string;
    icon?: ReactNode;
    onClick: () => void;
  }[];
};

export function Editor({
  blocks,
  onChange,
  toolbarItems,
}: EditorProps) {
  return (
    <div>
      <EditorToolbar items={toolbarItems} />

      <div>
        {blocks.map((block) => (
          <EditorBlock
            key={block.id}
            block={block}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}