// post/renderer/Video.tsx

import type { VideoBlock } from '../PostType';

export type VideoProps = {
  block: VideoBlock;
};

const DEFAULT_OPTION = {
  fit: 'contain' as const,
  autoplay: false,
  loop: false,
  muted: true,
  controls: true,
  radius: 'none' as const,
};

const RADIUS_MAP = {
  none: '0',
  small: '4px',
  medium: '8px',
  large: '16px',
} as const;

export function Video({ block }: VideoProps) {
  const option = {
    ...DEFAULT_OPTION,
    ...block.option,
  };

  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: RADIUS_MAP[option.radius],
      }}
    >
      <video
        src={block.data.url}
        autoPlay={option.autoplay}
        loop={option.loop}
        muted={option.muted}
        controls={option.controls}
        playsInline
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          objectFit: option.fit,
        }}
      >
        영상을 재생할 수 없습니다.
      </video>
    </div>
  );
}