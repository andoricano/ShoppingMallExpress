// post/renderer/Divider.tsx

import type { DividerBlock } from '../PostType';

export type DividerProps = {
  block: DividerBlock;
};

const DEFAULT_OPTION = {
  style: 'solid' as const,
  spacing: 'medium' as const,
};

const SPACING_MAP = {
  small: '8px 0',
  medium: '16px 0',
  large: '32px 0',
} as const;

const BORDER_STYLE_MAP = {
  solid: '1px solid',
  dashed: '1px dashed',
  dotted: '1px dotted',
} as const;

export function Divider({ block }: DividerProps) {
  const option = {
    ...DEFAULT_OPTION,
    ...block.option,
  };

  return (
    <div
      style={{
        width: '100%',
        padding: SPACING_MAP[option.spacing],
      }}
    >
      <hr
        style={{
          margin: 0,
          border: 0,
          borderTop: BORDER_STYLE_MAP[option.style],
        }}
      />
    </div>
  );
}