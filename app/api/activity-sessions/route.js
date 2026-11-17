import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { data, error } = await auth.supabase
    .from("activity_sessions")
    .select("id, activity_id, session_date, attendance_token, checkin_open")
    .order("session_date", { ascending: true });
  if (error) {
    console.error("Unable to load attendance sessions:", error);
    return errorResponse("Tanggal absensi gagal dimuat.");
  }
  return NextResponse.json(data);
}

export async function POST(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Data tanggal absensi tidak valid.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
    typeof body.activity_id !== "string" || !body.activity_id ||
    !isCalendarDate(body.session_date)) {
    return errorResponse("Pilih kegiatan dan tanggal absensi yang valid.", 400);
  }

  const { data: activity, error: activityError } = await auth.supabase
    .from("activities")
    .select("id")
    .eq("id", body.activity_id)
    .maybeSingle();
  if (activityError) {
    console.error("Unable to find activity for attendance session:", activityError);
    return errorResponse("Kegiatan tidak dapat diperiksa.");
  }
  if (!activity) return errorResponse("Kegiatan tidak ditemukan.", 404);

  const { data, error } = await auth.supabase.from("activity_sessions")
    .insert({ activity_id: activity.id, session_date: body.session_date })
    .select("id, activity_id, session_date, attendance_token, checkin_open")
    .single();
  if (error?.code === "23505") return errorResponse("Tanggal absensi ini sudah ditambahkan untuk kegiatan tersebut.", 409);
  if (error) {
    console.error("Unable to create attendance session:", error);
    return errorResponse("Tanggal absensi gagal ditambahkan.");
  }
  return NextResponse.json(data, { status: 201 });
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
    typeof body.checkin_open !== "boolean") {
    return errorResponse("Tanggal absensi dan status buka/tutup wajib diisi.", 400);
  }

  const { data, error } = await auth.supabase.from("activity_sessions")
    .update({ checkin_open: body.checkin_open })
    .eq("id", body.id)
    .select("id, checkin_open")
    .maybeSingle();
  if (error) {
    console.error("Unable to update attendance session:", error);
    return errorResponse("Status absensi gagal diperbarui.");
  }
  if (!data) return errorResponse("Tanggal absensi tidak ditemukan.", 404);
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return errorResponse("ID tanggal absensi wajib diisi.", 400);
  const { data, error } = await auth.supabase.from("activity_sessions")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("Unable to delete attendance session:", error);
    return errorResponse("Tanggal absensi gagal dihapus.");
  }
  if (!data) return errorResponse("Tanggal absensi tidak ditemukan.", 404);
  return NextResponse.json({ deleted: true });
}
