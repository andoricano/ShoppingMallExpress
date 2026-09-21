"use client";

import { AdminHeader } from "@/component/common/AdminHeader";
import { useRouter } from "next/navigation";

export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-slate-50/50">
            <div className="mx-auto w-full max-w-5xl px-6 py-10">
                <AdminHeader
                    title="상품 게시물 관리"
                    description="상품 게시물과 카테고리를 관리합니다."
                    menu={[
                        {
                            menuTitle: "게시물 관리",
                            onClick: () =>
                                router.replace("/posts"),
                        },
                        {
                            menuTitle: "카테고리 관리",
                            onClick: () =>
                                router.replace(
                                    "/posts/category",
                                ),
                        },
                    ]}
                />

                {children}
            </div>
        </main>
    );
}