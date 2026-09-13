// apps/user-web/component/design/main/footer/AdminBusinessInfoFooter.tsx

"use client";

import type { PageFooterConfig } from "@mall/mall-page-viewer";

interface AdminBusinessInfoFooterProps {
    config: PageFooterConfig;

    onChange: (
        footer: PageFooterConfig,
    ) => void;
}

export default function AdminBusinessInfoFooter({
    config,
    onChange,
}: AdminBusinessInfoFooterProps) {
    const updateConfig = (
        updates: Partial<PageFooterConfig>,
    ) => {
        onChange({
            ...config,
            ...updates,
        });
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Footer
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        쇼핑몰의 사업자 및 고객센터 정보를 관리합니다.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={
                            config.isActive
                                ? "text-sm text-emerald-600"
                                : "text-sm text-slate-400"
                        }
                    >
                        {config.isActive
                            ? "활성"
                            : "비활성"}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            updateConfig({
                                isActive:
                                    !config.isActive,
                            })
                        }
                        className="cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        {config.isActive
                            ? "비활성화"
                            : "활성화"}
                    </button>
                </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="text-sm font-medium text-slate-700">
                        사업자명
                    </label>

                    <input
                        value={config.businessName}
                        onChange={(event) =>
                            updateConfig({
                                businessName:
                                    event.target.value,
                            })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700">
                        대표자명
                    </label>

                    <input
                        value={
                            config.representativeName
                        }
                        onChange={(event) =>
                            updateConfig({
                                representativeName:
                                    event.target.value,
                            })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700">
                        사업자등록번호
                    </label>

                    <input
                        value={
                            config.businessNumber
                        }
                        onChange={(event) =>
                            updateConfig({
                                businessNumber:
                                    event.target.value,
                            })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-slate-700">
                        고객센터
                    </label>

                    <input
                        value={
                            config.customerCenter ??
                            ""
                        }
                        onChange={(event) =>
                            updateConfig({
                                customerCenter:
                                    event.target.value,
                            })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                        주소
                    </label>

                    <input
                        value={config.address}
                        onChange={(event) =>
                            updateConfig({
                                address:
                                    event.target.value,
                            })
                        }
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                        추가 정보
                    </label>

                    <textarea
                        value={
                            config.additionalInfo ??
                            ""
                        }
                        onChange={(event) =>
                            updateConfig({
                                additionalInfo:
                                    event.target.value,
                            })
                        }
                        rows={4}
                        className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    />
                </div>
            </div>
        </section>
    );
}