// post/editor/LinkEditor.tsx

import type { ChangeEvent } from 'react';

import type {
  LinkBlock,
  LinkOption,
} from '../../PostType';

export type LinkEditorProps = {
  block: LinkBlock;
  onChange: (block: LinkBlock) => void;
};

const DEFAULT_OPTION: Required<LinkOption> = {
  open: 'external',
  preview: true,
  target: 'blank',
};

export function LinkEditor({
  block,
  onChange,
}: LinkEditorProps) {
  const option: Required<LinkOption> = {
    ...DEFAULT_OPTION,
    ...block.option,
  };

  const handleUrlChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onChange({
      ...block,
      data: {
        ...block.data,
        url: event.target.value,
      },
    });
  };

  const handleOptionChange = (
    optionUpdate: Partial<LinkOption>,
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
      <input
        type="url"
        value={block.data.url}
        onChange={handleUrlChange}
        placeholder="링크 URL을 입력하세요."
      />

      <div>
        <select
          value={option.open}
          onChange={(event) => {
            handleOptionChange({
              open: event.target.value as
                | 'external'
                | 'internal',
            });
          }}
        >
          <option value="external">외부 링크</option>
          <option value="internal">내부 링크</option>
        </select>

        <label>
          <input
            type="checkbox"
            checked={option.preview}
            onChange={(event) => {
              handleOptionChange({
                preview: event.target.checked,
              });
            }}
          />
          링크 미리보기
        </label>

        <select
          value={option.target}
          onChange={(event) => {
            handleOptionChange({
              target: event.target.value as
                | 'self'
                | 'blank',
            });
          }}
        >
          <option value="self">현재 화면</option>
          <option value="blank">새 화면</option>
        </select>
      </div>

      {option.preview && block.data.meta && (
        <div>
          <p>{block.data.meta.title}</p>
          <p>{block.data.meta.description}</p>
          <p>{block.data.meta.siteName}</p>
        </div>
      )}
    </div>
  );
}