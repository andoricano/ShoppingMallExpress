// post/editor/EditorBlock.tsx


import { TextEditor } from './TextEditor';
import { ImageEditor } from './ImageEditor';
import { VideoEditor } from './VideoEditor';
import { LinkEditor } from './LinkEditor';
import { DividerEditor } from './DividerEditor';
import { PostBlock } from '../../PostType';

export type EditorBlockProps = {
  block: PostBlock;
  onChange: (block: PostBlock) => void;
};

export function EditorBlock({
  block,
  onChange,
}: EditorBlockProps) {
  switch (block.type) {
    case 'text':
      return (
        <TextEditor
          block={block}
          onChange={onChange}
        />
      );

    case 'image':
      return (
        <ImageEditor
          block={block}
          onChange={onChange}
        />
      );

    case 'video':
      return (
        <VideoEditor
          block={block}
          onChange={onChange}
        />
      );

    case 'link':
      return (
        <LinkEditor
          block={block}
          onChange={onChange}
        />
      );

    case 'divider':
      return (
        <DividerEditor
          block={block}
          onChange={onChange}
        />
      );

    default:
      return null;
  }
}