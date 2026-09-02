"use client";

import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";

import { EditSection } from "./EditSection";

interface ProductDescriptionEditorProps {
  initialContent?: JSONContent;
  onChange?: (content: JSONContent) => void;
}

export function ProductDescriptionEditor({
  initialContent,
  onChange,
}: ProductDescriptionEditorProps) {
  const [content, setContent] = useState<JSONContent | undefined>(
    initialContent,
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getJSON());
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) {
        onChange?.(content);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content, onChange]);

  return <EditSection editor={editor} />;
}