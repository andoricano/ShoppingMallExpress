"use client";

export type MyPageSidebarItem =
    | {
        type: "main";
        id: string;
        label: string;
    }
    | {
        type: "sub";
        id: string;
        label: string;
    }
    | {
        type: "divider";
        id: string;
    };

interface MyPageSidebarProps {
    items: MyPageSidebarItem[];
    selectedId?: string;
    onSelect?: (id: string) => void;
}

export function MyPageSidebar({
    items,
    selectedId,
    onSelect,
}: MyPageSidebarProps) {
    return (
        <aside className="w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <nav className="space-y-1">
                {items.map((item) => {
                    if (item.type === "divider") {
                        return (
                            <div
                                key={item.id}
                                className="my-3 border-t border-slate-200"
                            />
                        );
                    }

                    if (item.type === "main") {
                        return (
                            <div
                                key={item.id}
                                className="px-3 py-2 text-xs font-semibold text-slate-400"
                            >
                                {item.label}
                            </div>
                        );
                    }

                    const isSelected =
                        selectedId === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                                onSelect?.(item.id)
                            }
                            className={[
                                "w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                                isSelected
                                    ? "bg-slate-100 text-slate-900"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                            ].join(" ")}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}