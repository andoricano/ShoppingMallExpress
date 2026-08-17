// @/components/dev/DevTopbar.tsx
"use client";

export interface DevTabItem<T extends string = string> {
    id: T;
    label: string;
}

interface DevTopbarProps<T extends string = string> {
    tabs: DevTabItem<T>[];
    activeTab: T;
    onSelectTab: (tabId: T) => void;
}

export function DevTopbar<T extends string = string>({
    tabs,
    activeTab,
    onSelectTab,
}: DevTopbarProps<T>) {
    return (
        <div className="flex border-b border-zinc-800 gap-2">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onSelectTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${isActive
                                ? "border-blue-500 text-white"
                                : "border-transparent text-zinc-400 hover:text-zinc-200"
                            }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}