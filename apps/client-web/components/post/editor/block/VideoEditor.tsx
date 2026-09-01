// post/editor/VideoEditor.tsx

import type { ChangeEvent } from 'react';

import type {
  VideoBlock,
  VideoOption,
} from '../../PostType';

export type VideoEditorProps = {
  block: VideoBlock;
  onChange: (block: VideoBlock) => void;
};

const DEFAULT_OPTION: Required<VideoOption> = {
  fit: 'contain',
  autoplay: false,
  loop: false,
  muted: true,
  controls: true,
  radius: 'none',
};

export function VideoEditor({
  block,
  onChange,
}: VideoEditorProps) {
  const option: Required<VideoOption> = {
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
    optionUpdate: Partial<VideoOption>,
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
        placeholder="영상 URL을 입력하세요."
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

        <label>
          <input
            type="checkbox"
            checked={option.autoplay}
            onChange={(event) => {
              handleOptionChange({
                autoplay: event.target.checked,
              });
            }}
          />
          자동 재생
        </label>

        <label>
          <input
            type="checkbox"
            checked={option.loop}
            onChange={(event) => {
              handleOptionChange({
                loop: event.target.checked,
              });
            }}
          />
          반복 재생
        </label>

        <label>
          <input
            type="checkbox"
            checked={option.muted}
            onChange={(event) => {
              handleOptionChange({
                muted: event.target.checked,
              });
            }}
          />
          음소거
        </label>

        <label>
          <input
            type="checkbox"
            checked={option.controls}
            onChange={(event) => {
              handleOptionChange({
                controls: event.target.checked,
              });
            }}
          />
          재생 컨트롤
        </label>

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
          <option value="none">모서리 없음</option>
          <option value="small">작게</option>
          <option value="medium">보통</option>
          <option value="large">크게</option>
        </select>
      </div>
    </div>
  );
}