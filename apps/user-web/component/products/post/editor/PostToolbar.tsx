// post/editor/PostToolbar.tsx

import type { ReactNode } from 'react';

export type PostToolbarItem = {
  text: string;
  icon?: ReactNode;
  onClick: () => void;
};

export type PostToolbarProps = {
  items: PostToolbarItem[];
};

export function PostToolbar({ items }: PostToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderBottom: '1px solid #ddd',
      }}
    >
      {items.map((item, index) => (
        <button
          key={`${item.text}-${index}`}
          type="button"
          onClick={item.onClick}
        >
          {item.icon}
          {item.text}
        </button>
      ))}
    </div>
  );
}