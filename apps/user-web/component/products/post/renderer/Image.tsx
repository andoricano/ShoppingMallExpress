// post/renderer/Image.tsx

import type { ImageBlock } from '../PostType';

export type ImageProps = {
  block: ImageBlock;
};

const DEFAULT_OPTION = {
  fit: 'contain' as const,
  align: 'center' as const,
  radius: 'none' as const,
};

const RADIUS_MAP = {
  none: '0',
  small: '4px',
  medium: '8px',
  large: '16px',
} as const;

export function Image({ block }: ImageProps) {
  const option = {
    ...DEFAULT_OPTION,
    ...block.option,
  };

  const width =
    option.align === 'left'
      ? 'auto'
      : option.align === 'right'
        ? 'auto'
        : '100%';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          option.align === 'left'
            ? 'flex-start'
            : option.align === 'right'
              ? 'flex-end'
              : 'center',
        width: '100%',
      }}
    >
      <img
        src={block.data.url}
        alt={block.data.meta?.alt ?? ''}
        style={{
          display: 'block',
          width,
          maxWidth: '100%',
          height: 'auto',
          objectFit: option.fit,
          borderRadius: RADIUS_MAP[option.radius],
        }}
      />
    </div>
  );
}