import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const code = searchParams.get("code");
  const failure = () => NextResponse.redirect(`${origin}/?error=auth-failed`);
  if (!code || !url || !key) return failure();
  const jar = await cookies();
  const response = NextResponse.redirect(`${origin}/`);
  response.headers.set("Cache-Control", "no-store");
  const auth = createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { error } = await auth.auth.exchangeCodeForSession(code);
  return error ? failure() : response;
}
