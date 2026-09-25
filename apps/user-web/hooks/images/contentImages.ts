import type { JSONContent } from "@tiptap/core";

/**
 * Temporary editor image references are `blob:` object URLs created when an
 * image is inserted before upload. They must never be persisted.
 */
export function isTemporaryImageSource(src: unknown): src is string {
    return typeof src === "string" && src.startsWith("blob:");
}

/** Distinct temporary image sources referenced by `image` nodes. */
export function collectTemporaryImageSources(
    content: JSONContent | null | undefined,
): string[] {
    const sources = new Set<string>();

    const visit = (node: JSONContent) => {
        if (node.type === "image" && isTemporaryImageSource(node.attrs?.src)) {
            sources.add(node.attrs.src);
        }

        node.content?.forEach(visit);
    };

    if (content) {
        visit(content);
    }

    return [...sources];
}

/**
 * Returns a copy of `content` with `image` node sources replaced through
 * `replacements`. Throws if any temporary source remains unresolved.
 */
export function replaceImageSources(
    content: JSONContent,
    replacements: ReadonlyMap<string, string>,
): JSONContent {
    const visit = (node: JSONContent): JSONContent => {
        const next: JSONContent = { ...node };
        const src = node.attrs?.src;

        if (node.type === "image" && typeof src === "string") {
            const replaced = replacements.get(src) ?? src;

            if (isTemporaryImageSource(replaced)) {
                throw new Error(
                    "업로드되지 않은 본문 이미지가 있습니다. 이미지를 다시 추가해 주세요.",
                );
            }

            next.attrs = { ...node.attrs, src: replaced };
        }

        if (node.content) {
            next.content = node.content.map(visit);
        }

        return next;
    };

    return visit(content);
}
