import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export async function createClient(response?: NextResponse) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                if (response) {
                  response.cookies.set(name, value, options);
                } else {
                  cookieStore.set(name, value, options);
                }
              });
            } catch {
            // Server Components cannot always write refreshed cookies.
          }
        },
      },
    },
  );
}
