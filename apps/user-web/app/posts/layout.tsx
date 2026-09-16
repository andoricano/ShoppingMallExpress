// app/admin//layout.tsx

"use client";

export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-slate-50/50">
            <div className="mx-auto w-full max-w-5xl px-6 py-10">
                {children}
            </div>
        </main>
    );
}