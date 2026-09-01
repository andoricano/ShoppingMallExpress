// post/editor/ImageEditor.tsx

import type { ChangeEvent } from 'react';
import { ImageBlock, ImageOption } from '../../PostType';

export type ImageEditorProps = {
  block: ImageBlock;
  onChange: (block: ImageBlock) => void;
};

const DEFAULT_OPTION: Required<ImageOption> = {
  fit: 'contain',
  align: 'center',
  radius: 'none',
};

export function ImageEditor({
  block,
  onChange,
}: ImageEditorProps) {
  const option: Required<ImageOption> = {
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
    optionUpdate: Partial<ImageOption>,
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
        placeholder="이미지 URL을 입력하세요."
      />

      <div>
        <select
          value={option.fit}
          onChange={(event) => {
            handleOptionChange({
              fit: event.target.value as 'contain' | 'cover',
            });
          }}
        >
          <option value="contain">비율 유지</option>
          <option value="cover">영역 채우기</option>
        </select>

        <select
          value={option.align}
          onChange={(event) => {
            handleOptionChange({
              align: event.target.value as
                | 'left'
                | 'center'
                | 'right',
            });
          }}
        >
          <option value="left">왼쪽</option>
          <option value="center">가운데</option>
          <option value="right">오른쪽</option>
        </select>

        <select
          value={option.radius}
          onChange={(event) => {
            handleOptionChange({
              radius: event.target.value as
                | 'none'
                | 'small'
                | 'medium'
                | 'large',
            });
          }}
        >
          <option value="none">없음</option>
          <option value="small">작게</option>
          <option value="medium">보통</option>
          <option value="large">크게</option>
        </select>
      </div>
    </div>
  );
}