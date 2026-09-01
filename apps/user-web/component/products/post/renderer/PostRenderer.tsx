// post/renderer/PostRenderer.tsx

import type { PostBlock } from '../PostType';

import { Text } from './Text';
import { Image } from './Image';
import { Video } from './Video';
import { Link } from './Link';
import { Divider } from './Divider';

export type PostRendererProps = {
  blocks: PostBlock[];
};

export function PostRenderer({
  blocks,
}: PostRendererProps) {
  return (
    <div>
      {blocks.map((block) => {
        switch (block.type) {
          case 'text':
            return (
              <Text
                key={block.id}
                block={block}
              />
            );

          case 'image':
            return (
              <Image
                key={block.id}
                block={block}
              />
            );

          case 'video':
            return (
              <Video
                key={block.id}
                block={block}
              />
            );

          case 'link':
            return (
              <Link
                key={block.id}
                block={block}
              />
            );

          case 'divider':
            return (
              <Divider
                key={block.id}
                block={block}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}