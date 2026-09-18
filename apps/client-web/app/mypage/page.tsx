"use client";

import { MyInfoSection } from "@/components/mypage/my/MyInfoSection";
import { MyPageSidebar } from "@/components/mypage/MyPageSidbar";
import { MyPointSection } from "@/components/mypage/point/MyPointSection";
import { useMyPage } from "@/hooks/user/useMyPage";

export default function MyPage() {
    const {
        sidebarItems,
        selectedId,
        selectSection,
    } = useMyPage();

    const renderContent = () => {
        switch (selectedId) {
            case "info":
                return <MyInfoSection />;

            case "point":
                return <MyPointSection />;

            case "agreement":
                return (
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            약관 및 동의
                        </h2>
                    </section>
                );

            case "withdraw":
                return (
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">
                            회원 탈퇴
                        </h2>
                    </section>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">
                        마이페이지
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        내 정보와 계정 설정을 관리합니다.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                    <MyPageSidebar
                        items={sidebarItems}
                        selectedId={selectedId}
                        onSelect={selectSection}
                    />

                    <main className="min-w-0">
                        {renderContent()}
                    </main>
                </div>
            </div>
        </div>
    );
}