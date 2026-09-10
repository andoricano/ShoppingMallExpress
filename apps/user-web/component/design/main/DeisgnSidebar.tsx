"use client";

interface DesignSidebarProps {
    selectedSection?: string;
    onSelectSection?: (
        section: string,
    ) => void;
}

const sections = [
    {
        id: "HEADER",
        label: "Header",
    },
    {
        id: "HERO",
        label: "Hero",
    },
    {
        id: "PRODUCT",
        label: "Product",
    },
    {
        id: "PROMOTION",
        label: "Promotion",
    },
    {
        id: "FOOTER",
        label: "Footer",
    },
];

export default function DesignSidebar({
    selectedSection,
    onSelectSection,
}: DesignSidebarProps) {
    return (
        <aside className="w-56 shrink-0 border-r border-slate-200 bg-white">
            <div className="sticky top-0 p-4">
                <div className="mb-4 px-2">
                    <h2 className="text-sm font-semibold text-slate-900">
                        페이지 구성
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                        편집할 영역을 선택하세요.
                    </p>
                </div>

                <nav className="space-y-1">
                    {sections.map(
                        (section) => {
                            const isSelected =
                                selectedSection ===
                                section.id;

                            return (
                                <button
                                    key={
                                        section.id
                                    }
                                    type="button"
                                    onClick={() =>
                                        onSelectSection?.(
                                            section.id,
                                        )
                                    }
                                    className={
                                        isSelected
                                            ? "w-full rounded-lg bg-slate-900 px-3 py-2.5 text-left text-sm font-medium text-white"
                                            : "w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                    }
                                >
                                    {
                                        section.label
                                    }
                                </button>
                            );
                        },
                    )}
                </nav>
            </div>
        </aside>
    );
}