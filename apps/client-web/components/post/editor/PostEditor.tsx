// post/editor/PostEditor.tsx

import { useState } from 'react';
import type { PostBlock } from '../PostType';

import { PostToolbar } from './PostToolbar';
import { Editor } from './Editor';

export type PostEditorProps = {
  initialBlocks?: PostBlock[];
  onChange?: (blocks: PostBlock[]) => void;
  onSave?: (blocks: PostBlock[]) => void;
  onPreview?: (blocks: PostBlock[]) => void;
  onPublish?: (blocks: PostBlock[]) => void;
};

function createBlockId() {
  return crypto.randomUUID();
}

export function PostEditor({
  initialBlocks = [],
  onChange,
  onSave,
  onPreview,
  onPublish,
}: PostEditorProps) {
  const [blocks, setBlocks] = useState<PostBlock[]>(
    initialBlocks,
  );

  const updateBlocks = (nextBlocks: PostBlock[]) => {
    setBlocks(nextBlocks);
    onChange?.(nextBlocks);
  };

  const addBlock = (block: PostBlock) => {
    updateBlocks([
      ...blocks,
      {
        ...block,
        id: block.id || createBlockId(),
      },
    ]);
  };

  const updateBlock = (updatedBlock: PostBlock) => {
    updateBlocks(
      blocks.map((block) =>
        block.id === updatedBlock.id
          ? updatedBlock
          : block,
      ),
    );
  };

  const removeBlock = (blockId: string) => {
    updateBlocks(
      blocks.filter((block) => block.id !== blockId),
    );
  };

  const handleSave = () => {
    onSave?.(blocks);
  };

  const handlePreview = () => {
    onPreview?.(blocks);
  };

  const handlePublish = () => {
    onPublish?.(blocks);
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

  const editorToolbarItems = [
    {
      text: '텍스트',
      onClick: () =>
        addBlock({
          id: '',
          type: 'text',
          data: {
            text: '',
          },
        }),
    },
    {
      text: '이미지',
      onClick: () =>
        addBlock({
          id: '',
          type: 'image',
          data: {
            url: '',
          },
        }),
    },
    {
      text: '영상',
      onClick: () =>
        addBlock({
          id: '',
          type: 'video',
          data: {
            url: '',
          },
        }),
    },
    {
      text: '링크',
      onClick: () =>
        addBlock({
          id: '',
          type: 'link',
          data: {
            url: '',
          },
        }),
    },
    {
      text: '구분선',
      onClick: () =>
        addBlock({
          id: '',
          type: 'divider',
          data: null,
        }),
    },
  ];

  return (
    <div>
      <PostToolbar items={postToolbarItems} />

      <Editor
        blocks={blocks}
        onChange={updateBlock}
        toolbarItems={editorToolbarItems}
      />
    </div>
  );
}