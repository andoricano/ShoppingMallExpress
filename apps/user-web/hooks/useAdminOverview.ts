"use client";

import {
    useCallback,
    useState,
} from "react";

import type {
    AdminDashboardOverview,
} from "@mall/types";
import {
    API_ENDPOINTS,
} from "@mall/constants";

import {
    createClient,
} from "@/lib/supabase/client";
import {
    useAdminAuthStore,
} from "@/store/useAdminAuth";

interface AdminOverviewResponse {
    data?: AdminDashboardOverview;
    message?: string;
}

export function useAdminOverview() {
    const [overview, setOverview] = useState<
        AdminDashboardOverview | null
    >(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);

    const signOut = useAdminAuthStore(
        (state) => state.signOut,
    );

    const fetchOverview = useCallback(
        async () => {
            setLoading(true);
            setError(null);
            setForbidden(false);

            try {
                const supabase = createClient();
                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError || !session?.access_token) {
                    await signOut();
                    return;
                }

                const response = await fetch(
                    API_ENDPOINTS.ADMIN_OVERVIEW.BASE,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${session.access_token}`,
                        },
                    },
                );

                const result: AdminOverviewResponse | null =
                    await response.json().catch(() => null);

                if (response.status === 401) {
                    await signOut();
                    return;
                }

                if (response.status === 403) {
                    setForbidden(true);
                    setError(
                        result?.message ||
                        "관리자 권한이 없습니다.",
                    );
                    return;
                }

                if (!response.ok || !result?.data) {
                    throw new Error(
                        result?.message ||
                        "Dashboard 정보를 불러오지 못했습니다.",
                    );
                }

                setOverview(result.data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Dashboard 정보를 불러오지 못했습니다.",
                );
                setOverview(null);
            } finally {
                setLoading(false);
            }
        },
        [signOut],
    );

    return {
        overview,
        loading,
        error,
        forbidden,
        fetchOverview,
    };
}
