// post/renderer/Link.tsx

import type { LinkBlock } from '../PostType';

export type LinkProps = {
  block: LinkBlock;
};

const DEFAULT_OPTION = {
  open: 'external' as const,
  preview: true,
  target: 'blank' as const,
};

export function Link({ block }: LinkProps) {
  const option = {
    ...DEFAULT_OPTION,
    ...block.option,
  };

  const target = option.target === 'blank' ? '_blank' : '_self';

  return (
    <a
      href={block.data.url}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {option.preview && block.data.meta ? (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {block.data.meta.imageUrl && (
            <img
              src={block.data.meta.imageUrl}
              alt=""
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
              }}
            />
          )}

          <div style={{ padding: '12px' }}>
            {block.data.meta.siteName && (
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: '12px',
                }}
              >
                {block.data.meta.siteName}
              </p>
            )}

            {block.data.meta.title && (
              <p
                style={{
                  margin: '0 0 4px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {block.data.meta.title}
              </p>
            )}

            {block.data.meta.description && (
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                }}
              >
                {block.data.meta.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <span>{block.data.url}</span>
      )}
    </a>
  );
}