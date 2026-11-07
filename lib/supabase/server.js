import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

export function createSupabaseServerClient(accessToken) {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  });
}

export function getAccessToken(request) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export async function getAdminSupabase(request) {
  const accessToken = getAccessToken(request);
  if (!accessToken) return { error: "Silakan masuk dengan akun admin.", status: 401 };

  try {
    const supabase = createSupabaseServerClient(accessToken);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return { error: "Sesi login tidak valid. Silakan masuk kembali.", status: 401 };
    if (user.app_metadata?.role !== "admin") {
      return { error: "Akun ini belum diberi akses admin.", status: 403 };
    }

    return { supabase, user };
  } catch (error) {
    return { error: error.message, status: 503 };
  }
}
