// editor/EditorType.ts

import type { PostBlock } from '../PostType';

/**
 * Editor에서 지원하는 Block 종류
 */
export type EditorBlockType = PostBlock['type'];

/**
 * Editor의 전체 상태
 */
export type EditorState = {
  blocks: PostBlock[];
};

/**
 * Block 수정
 */
export type UpdateBlockPayload = {
  id: string;
  block: PostBlock;
};

/**
 * Block 위치 이동
 */
export type MoveBlockPayload = {
  fromIndex: number;
  toIndex: number;
};

/**
 * Block 추가 / "/" Command
 */
export type EditorCommand = PostBlock['type'];

/**
 * Editor Toolbar Action
 */
export type EditorToolbarAction =
  | 'undo'
  | 'redo'
  | 'save'
  | 'preview'
  | 'publish';

/**
 * 현재 선택된 Block
 */
export type EditorSelection = {
  blockId: string | null;
};

/**
 * PostEditor Props
 */
export type EditorProps = {
  initialBlocks?: PostBlock[];
  onChange?: (blocks: PostBlock[]) => void;
  onSave?: (blocks: PostBlock[]) => void;
  onPreview?: (blocks: PostBlock[]) => void;
  onPublish?: (blocks: PostBlock[]) => void;
};