// post/editor/EditorToolbar.tsx

import type { ReactNode } from 'react';

export type EditorToolbarItem = {
  text: string;
  icon?: ReactNode;
  onClick: () => void;
};

export type EditorToolbarProps = {
  items: EditorToolbarItem[];
};

export function EditorToolbar({
  items,
}: EditorToolbarProps) {
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