// packages/mall-page-viewer/src/components/footer/Footer.tsx

"use client";

import type { PageFooterConfig } from "../../types/mainPage";

interface BusinessInfoFooterProps {
    config: PageFooterConfig;
}

export default function BusinessInfoFooter({
    config,
}: BusinessInfoFooterProps) {
    if (!config.isActive) {
        return null;
    }

    return (
        <footer className="border-t border-neutral-800 bg-neutral-900 py-12 text-xs text-neutral-400">
            <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col justify-between gap-6 md:flex-row">
                    {/* 사업자 기본 정보 */}
                    <div className="space-y-1.5 leading-relaxed">
                        <p className="mb-2 text-sm font-bold text-white">
                            {config.businessName}
                        </p>

                        <p>
                            대표자:{" "}
                            {config.representativeName}
                            {" | "}
                            사업자등록번호:{" "}
                            {config.businessNumber}
                        </p>

                        <p>
                            주소: {config.address}
                        </p>
                    </div>

                    {/* 고객센터 */}
                    {config.customerCenter && (
                        <div className="space-y-1.5 leading-relaxed">
                            <p className="mb-2 text-sm font-bold text-white">
                                고객센터
                            </p>

                            <p className="text-base font-semibold text-white">
                                {
                                    config.customerCenter
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* 추가 정보 */}
                {config.additionalInfo && (
                    <div className="leading-relaxed text-neutral-500">
                        {
                            config.additionalInfo
                        }
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-neutral-800 pt-6 text-[11px] text-neutral-500">
                    <p>
                        ©{" "}
                        {new Date().getFullYear()}{" "}
                        {config.businessName}. All
                        rights reserved.
                    </p>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            className="hover:underline"
                        >
                            이용약관
                        </button>

                        <button
                            type="button"
                            className="font-bold text-neutral-300 hover:underline"
                        >
                            개인정보처리방침
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}