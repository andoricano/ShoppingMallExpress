import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth-failed`);
  }

  const response = NextResponse.redirect(`${origin}/`);
  response.headers.set("Cache-Control", "no-store");
  const supabase = await createClient(response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Auth Callback]", error);
    return NextResponse.redirect(`${origin}/?error=auth-failed`);
  }

  return response;
}
