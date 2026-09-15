"use client";

import { usePoint } from "@/hooks/point/usePoint";
import { useEffect } from "react";


export default function PointPage() {
    const {
        point,
        loading,
        error,
        fetchPoint,
        chargePoint,
    } = usePoint();

    useEffect(() => {
        fetchPoint();
    }, [fetchPoint]);

    const handleCharge = async () => {
        await chargePoint(10_000);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="mx-auto max-w-2xl">
                <section className="rounded-xl border border-slate-200 bg-white p-6">
                    <h1 className="text-xl font-bold text-slate-900">
                        Point
                    </h1>

                    <div className="mt-6">
                        <p className="text-sm text-slate-500">
                            현재 보유 포인트
                        </p>

                        <p className="mt-2 text-3xl font-bold text-slate-900">
                            {point?.balance?.toLocaleString(
                                "ko-KR",
                            ) ?? 0}
                            P
                        </p>
                    </div>

                    {error && (
                        <p className="mt-4 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={
                            handleCharge
                        }
                        disabled={loading}
                        className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "처리 중..."
                            : "+10,000P 충전"}
                    </button>
                </section>
            </div>
        </div>
    );
}