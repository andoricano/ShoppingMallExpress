import {
    createClient,
} from "@/lib/supabase/client";

export async function fetchAdminApi(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    const supabase = createClient();
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
        throw new Error("관리자 세션이 없습니다. 다시 로그인해주세요.");
    }

    const headers = new Headers(init?.headers);

    headers.set(
        "Authorization",
        `Bearer ${session.access_token}`,
    );

    return fetch(input, {
        ...init,
        headers,
    });
}
