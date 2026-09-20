import type { Session } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

export function getAuth() {
  return createClient();
}

export const authProfile = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await createClient().auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signInWithGoogle() {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  },

  async signOut() {
    const { error } = await createClient().auth.signOut();
    if (error) throw error;
  },
};
