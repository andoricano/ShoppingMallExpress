// post/renderer/Text.tsx

import type { TextBlock } from '../PostType';

export type TextProps = {
  block: TextBlock;
};

const DEFAULT_OPTION = {
  align: 'left' as const,
  size: 'medium' as const,
  weight: 'normal' as const,
};

const SIZE_MAP = {
  small: '14px',
  medium: '16px',
  large: '20px',
} as const;

export function Text({ block }: TextProps) {
  const option = {
    ...DEFAULT_OPTION,
    ...block.option,
  };

  return (
    <p
      style={{
        margin: 0,
        textAlign: option.align,
        fontSize: SIZE_MAP[option.size],
        fontWeight: option.weight === 'bold' ? 700 : 400,
      }}
    >
      {block.data.text}
    </p>
  );
}