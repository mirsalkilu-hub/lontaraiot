"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

let browserClient;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, key } = getSupabaseConfig();
    browserClient = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }
  return browserClient;
}
