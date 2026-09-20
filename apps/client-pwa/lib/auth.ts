import { createBrowserClient } from "@supabase/ssr";

export function getAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("로그인 환경 설정이 필요합니다. 관리자에게 문의해 주세요.");
  return createBrowserClient(url, key);
}
