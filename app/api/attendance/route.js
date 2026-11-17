import { NextResponse } from "next/server";
import { createSupabaseServerClient, getAdminSupabase } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

const tokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token");
  if (token) {
    if (!tokenPattern.test(token)) return errorResponse("Tautan absensi tidak valid.", 400);
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.rpc("get_shared_attendance_session", { p_token: token });
      if (error) throw error;
      if (!data?.length) return errorResponse("Tautan absensi sudah ditutup atau tidak valid.", 404);
      return NextResponse.json(data[0]);
    } catch (error) {
      console.error("Unable to load shared attendance session:", error);
      return errorResponse("Informasi absensi tidak dapat dimuat. Periksa skema Supabase.", 503);
    }
  }

  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { data, error } = await auth.supabase
    .from("attendance_records")
    .select("id, session_id, registration_id, attended, marked_at, activity_sessions!inner(id, activity_id, session_date), registrations!inner(id, full_name, gender, email, phone, organization)")
    .order("marked_at", { ascending: false, nullsFirst: true });
  if (error) {
    console.error("Unable to load attendance records:", error);
    return errorResponse("Rekap absensi gagal dimuat.");
  }
  return NextResponse.json(data);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Data check-in tidak valid.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
    typeof body.token !== "string" || !tokenPattern.test(body.token) ||
    typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) ||
    typeof body.phone !== "string" || !body.phone.trim() || body.phone.trim().length > 40 || !/\d/.test(body.phone)) {
    return errorResponse("Masukkan email dan nomor telepon yang digunakan saat mendaftar.", 400);
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc("submit_shared_attendance", {
      p_token: body.token,
      p_email: body.email.trim().toLowerCase(),
      p_phone: body.phone.trim(),
    });
    if (error) throw error;
    if (!data) return errorResponse("Data pendaftaran tidak cocok dengan kegiatan atau absensi sudah ditutup.", 409);
    return NextResponse.json({ checkedIn: true });
  } catch (error) {
    console.error("Unable to check in participant:", error);
    return errorResponse("Check-in gagal diproses. Periksa skema Supabase.", 503);
  }
}

export async function PATCH(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Data absensi tidak valid.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
    typeof body.id !== "string" || !body.id ||
    typeof body.attended !== "boolean") {
    return errorResponse("ID absensi dan status kehadiran wajib diisi.", 400);
  }
  const { data, error } = await auth.supabase.from("attendance_records")
    .update({ attended: body.attended, marked_at: body.attended ? new Date().toISOString() : null })
    .eq("id", body.id)
    .select("id, attended, marked_at")
    .maybeSingle();
  if (error) {
    console.error("Unable to update attendance record:", error);
    return errorResponse("Absensi gagal diperbarui.");
  }
  if (!data) return errorResponse("Data absensi tidak ditemukan.", 404);
  return NextResponse.json(data);
}
