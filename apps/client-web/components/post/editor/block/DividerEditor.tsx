// post/editor/DividerEditor.tsx

import type { DividerBlock, DividerOption } from '../../PostType';

export type DividerEditorProps = {
  block: DividerBlock;
  onChange: (block: DividerBlock) => void;
};

const DEFAULT_OPTION: Required<DividerOption> = {
  style: 'solid',
  spacing: 'medium',
};

export function DividerEditor({
  block,
  onChange,
}: DividerEditorProps) {
  const option: Required<DividerOption> = {
    ...DEFAULT_OPTION,
    ...block.option,
  };

  const handleOptionChange = (
    optionUpdate: Partial<DividerOption>,
  ) => {
    onChange({
      ...block,
      option: {
        ...block.option,
        ...optionUpdate,
      },
    });
  };

  return (
    <div>
      <select
        value={option.style}
        onChange={(event) => {
          handleOptionChange({
            style: event.target.value as
              | 'solid'
              | 'dashed'
              | 'dotted',
          });
        }}
      >
        <option value="solid">실선</option>
        <option value="dashed">점선</option>
        <option value="dotted">점점선</option>
      </select>

      <select
        value={option.spacing}
        onChange={(event) => {
          handleOptionChange({
            spacing: event.target.value as
              | 'small'
              | 'medium'
              | 'large',
          });
        }}
      >
        <option value="small">좁게</option>
        <option value="medium">보통</option>
        <option value="large">넓게</option>
      </select>
    </div>
  );
}