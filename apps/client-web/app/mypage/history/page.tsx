// app/history/page.tsx

"use client";

import { useEffect } from "react";

import { useHistory } from "@/hooks/useHistory";

export default function HistoryPage() {
    const {
        historyList,
        loading,
        error,
        fetchHistory,
    } = useHistory();

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (loading) {
        return <div>History 불러오는 중...</div>;
    }

    if (error) {
        return <div>오류: {error}</div>;
    }

    return (
        <div>
            <h1>내 History</h1>

            {historyList.length === 0 ? (
                <p>History가 없습니다.</p>
            ) : (
                historyList.map((history) => (
                    <div key={history.id}>
                        <p>
                            {history.action}
                        </p>

                        <p>
                            대상:{" "}
                            {history.targetType} /{" "}
                            {history.targetId}
                        </p>

                        <p>
                            {history.createdAt}
                        </p>
                    </div>
                ))
            )}
        </div>
    );
}