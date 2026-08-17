export function UiGallerySection() {
    return (
        <div className="flex gap-4">
            <button className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-500">Primary</button>
            <button className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm hover:bg-zinc-700">Secondary</button>
        </div>
    );
}