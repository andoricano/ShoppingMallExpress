// post/editor/EditorToolbar.tsx

"use client";

import TextAlign from "@tiptap/extension-text-align";
import type { Editor } from "@tiptap/react";
import { EditorToolButton } from "./EditorToolButton";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image,
  Video,
  Link,
  Minus,
} from "lucide-react";

export type EditorToolbarProps = {
  editor: Editor | null;

  onImage?: () => void;
  onVideo?: () => void;
  onLink?: () => void;
  onHorizontalRule?: () => void;
};

export function EditorToolbar({
  editor,
  onImage,
  onVideo,
  onLink,
  onHorizontalRule,
}: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 bg-white p-2">
      {/* 텍스트 서식 */}
      <EditorToolButton
        text="B"
        active={editor.isActive("bold")}
        onClick={() =>
          editor.chain().focus().toggleBold().run()
        }
      />

      <EditorToolButton
        text="I"
        active={editor.isActive("italic")}
        onClick={() =>
          editor.chain().focus().toggleItalic().run()
        }
      />

      <EditorToolButton
        icon={
          <span className="line-through">
            S
          </span>
        }
        active={editor.isActive("strike")}
        onClick={() =>
          editor.chain().focus().toggleStrike().run()
        }
      />

      <div className="mx-1 h-5 w-px bg-slate-200" />


      <EditorToolButton
        icon={<AlignLeft size={16} />}
        active={editor.isActive({
          textAlign: "left",
        })}
        onClick={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
      />

      <EditorToolButton
        icon={<AlignCenter size={16} />}
        active={editor.isActive({
          textAlign: "center",
        })}
        onClick={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
      />

      <EditorToolButton
        icon={<AlignRight size={16} />}
        active={editor.isActive({
          textAlign: "right",
        })}
        onClick={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
      />

      <div className="mx-1 h-5 w-px bg-slate-200" />

      {/* 삽입 */}
      {onImage && (
        <EditorToolButton
          icon={<Image size={16} />}
          onClick={onImage}
        />
      )}

      {onVideo && (
        <EditorToolButton
          icon={<Video size={16} />}
          onClick={onVideo}
        />
      )}

      {onLink && (
        <EditorToolButton
          icon={<Link size={16} />}
          onClick={onLink}
        />
      )}

      {onHorizontalRule && (
        <EditorToolButton
          icon={<Minus size={16} />}
          onClick={onHorizontalRule}
        />
      )}
    </div>
  );
}