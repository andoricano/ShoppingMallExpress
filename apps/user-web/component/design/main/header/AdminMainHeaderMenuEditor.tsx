// apps/user-web/component/design/main/header/AdminMainHeaderMenuEditor.tsx

"use client";

import { HeaderMenuItem } from "@mall/mall-page-viewer/src/types/mainPage";



interface AdminMainHeaderMenuEditorProps {
    menu: HeaderMenuItem;

    onChange: (
        menu: HeaderMenuItem,
    ) => void;

    onClose: () => void;
}

export default function AdminMainHeaderMenuEditor({
    menu,
    onChange,
    onClose,
}: AdminMainHeaderMenuEditorProps) {
    const updateMenu = (
        updates: Partial<HeaderMenuItem>,
    ) => {
        onChange({
            ...menu,
            ...updates,
        });
    };

    const addChildMenu = () => {
        onChange({
            ...menu,
            children: [
                ...(menu.children ?? []),
                {
                    id: crypto.randomUUID(),
                    title: "새 하위 메뉴",
                    href: "/",
                },
            ],
        });
    };

    const updateChildMenu = (
        childId: string,
        updates: Partial<HeaderMenuItem>,
    ) => {
        onChange({
            ...menu,
            children: menu.children?.map(
                (child) =>
                    child.id === childId
                        ? {
                            ...child,
                            ...updates,
                        }
                        : child,
            ),
        });
    };

    const removeChildMenu = (
        childId: string,
    ) => {
        onChange({
            ...menu,
            children: menu.children?.filter(
                (child) =>
                    child.id !== childId,
            ),
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h3 className="font-semibold text-slate-900">
                            메뉴 편집
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                            메뉴와 하위 메뉴를 설정합니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-slate-400 hover:text-slate-700"
                    >
                        닫기
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-6">
                    {/* Main Menu */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                메뉴 이름
                            </label>

                            <input
                                type="text"
                                value={menu.title}
                                onChange={(event) =>
                                    updateMenu({
                                        title: event.target
                                            .value,
                                    })
                                }
                                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">
                                이동 경로
                            </label>

                            <input
                                type="text"
                                value={menu.href}
                                onChange={(event) =>
                                    updateMenu({
                                        href: event.target
                                            .value,
                                    })
                                }
                                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            />
                        </div>
                    </div>

                    {/* Children */}
                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-800">
                                    하위 메뉴
                                </h4>

                                <p className="mt-1 text-xs text-slate-400">
                                    펼침 메뉴로 사용할 하위 메뉴입니다.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addChildMenu}
                                className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                                하위 메뉴 추가
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {menu.children?.map(
                                (child) => (
                                    <div
                                        key={
                                            child.id
                                        }
                                        className="rounded-lg border border-slate-200 p-3"
                                    >
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={
                                                    child.title
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    updateChildMenu(
                                                        child.id,
                                                        {
                                                            title: event
                                                                .target
                                                                .value,
                                                        },
                                                    )
                                                }
                                                placeholder="하위 메뉴 이름"
                                                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400"
                                            />

                                            <input
                                                type="text"
                                                value={
                                                    child.href
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    updateChildMenu(
                                                        child.id,
                                                        {
                                                            href: event
                                                                .target
                                                                .value,
                                                        },
                                                    )
                                                }
                                                placeholder="이동 경로"
                                                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400"
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeChildMenu(
                                                        child.id,
                                                    )
                                                }
                                                className="px-2 text-xs text-rose-500 hover:text-rose-700"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                ),
                            )}

                            {(!menu.children ||
                                menu.children
                                    .length === 0) && (
                                    <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center text-xs text-slate-400">
                                        하위 메뉴가 없습니다.
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}