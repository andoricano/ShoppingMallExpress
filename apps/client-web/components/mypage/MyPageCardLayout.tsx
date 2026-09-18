"use client";

import type { ReactNode } from "react";

export interface MyPageCardAction {
    label?: string;
    icon?: ReactNode;

    onClick: () => void;

    disabled?: boolean;
    ariaLabel?: string;
}

interface MyPageCardLayoutProps {
    title: string;
    description?: string;
    actions?: MyPageCardAction[];
    children: ReactNode;
}

export function MyPageCardLayout({
    title,
    description,
    actions = [],
    children,
}: MyPageCardLayoutProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {title}
                        </h2>

                        {description && (
                            <p className="mt-1 text-sm text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>

                    {actions.length > 0 && (
                        <div className="flex shrink-0 items-center gap-2">
                            {actions.map(
                                (action, index) => {
                                    const isIconOnly =
                                        !!action.icon &&
                                        !action.label;

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={
                                                action.onClick
                                            }
                                            disabled={
                                                action.disabled
                                            }
                                            aria-label={
                                                action.ariaLabel ??
                                                action.label
                                            }
                                            className={[
                                                "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                                                "disabled:cursor-not-allowed disabled:opacity-50",
                                                isIconOnly
                                                    ? "h-9 w-9 border border-slate-300 text-slate-600 hover:bg-slate-50"
                                                    : "border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50",
                                            ].join(" ")}
                                        >
                                            {action.icon && (
                                                <span
                                                    className={
                                                        action.label
                                                            ? "mr-1.5"
                                                            : undefined
                                                    }
                                                >
                                                    {
                                                        action.icon
                                                    }
                                                </span>
                                            )}

                                            {action.label}
                                        </button>
                                    );
                                },
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {children}
            </div>
        </section>
    );
}