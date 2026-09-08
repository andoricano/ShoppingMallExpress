// packages/tiptap/viewer/TiptapViewer.tsx

import type { JSONContent } from "@tiptap/core";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";

import { tiptapExtensions } from "../index";

export interface TiptapViewerProps {
    content: string;
}

export function TiptapViewer({
    content,
}: TiptapViewerProps) {
    if (!content) {
        return null;
    }

    let json: JSONContent;

    try {
        json = JSON.parse(content) as JSONContent;
    } catch {
        return null;
    }

    return (
        <div
            className="
                text-slate-900

                [&_p]:mb-4
                [&_h1]:mb-4
                [&_h1]:text-3xl
                [&_h1]:font-bold

                [&_h2]:mb-3
                [&_h2]:text-2xl
                [&_h2]:font-bold

                [&_h3]:mb-3
                [&_h3]:text-xl
                [&_h3]:font-semibold

                [&_ul]:mb-4
                [&_ul]:list-disc
                [&_ul]:pl-6

                [&_ol]:mb-4
                [&_ol]:list-decimal
                [&_ol]:pl-6

                [&_li]:mb-1

                [&_blockquote]:my-4
                [&_blockquote]:border-l-4
                [&_blockquote]:border-slate-300
                [&_blockquote]:pl-4
                [&_blockquote]:text-slate-600

                [&_img]:my-6
                [&_img]:max-w-full
                [&_img]:rounded-lg

                [&_a]:text-blue-600
                [&_a]:underline

                [&_hr]:my-8
                [&_hr]:border-slate-200
            "
        >
            {renderToReactElement({
                extensions: tiptapExtensions,
                content: json,
            })}
        </div>
    );
}