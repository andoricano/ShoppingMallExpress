import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";

export const tiptapExtensions = [
    StarterKit,
    Image,
    TextAlign.configure({
        types: ["heading", "paragraph"],
    }),
];

export { TiptapViewer } from "./viewer/TiptapViewer";