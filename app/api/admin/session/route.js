import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../../lib/supabase/server";

export async function GET(request) {
  try {
    const auth = await getAdminSupabase(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    return NextResponse.json({ authenticated: true, email: auth.user.email });
  } catch (error) {
    console.error("Unable to verify Supabase admin session:", error);
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
}
