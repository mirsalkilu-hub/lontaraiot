import { NextResponse } from "next/server";
import { createSupabaseServerClient, getAdminSupabase } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

const fields = ["title", "activity_type", "description", "activity_date", "location"];

function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function readActivity(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const activity = {};
  for (const field of fields) {
    if (typeof body[field] !== "string") return null;
    activity[field] = body[field].trim();
  }
  if (!activity.title || activity.title.length > 120 ||
    !activity.activity_type || activity.activity_type.length > 80 ||
    !activity.description || activity.description.length > 2000 ||
    !activity.location || activity.location.length > 160 ||
    !isCalendarDate(activity.activity_date) ||
    typeof body.registration_open !== "boolean") return null;
  activity.registration_open = body.registration_open;
  return activity;
}

export async function GET(request) {
  try {
    const supabase = createSupabaseServerClient();
    const hasAuthorization = Boolean(request.headers.get("authorization"));
    let query = supabase
      .from("activities")
      .select("id, title, activity_type, description, activity_date, location, registration_open");
    if (hasAuthorization) {
      const auth = await getAdminSupabase(request);
      if (auth.error) return errorResponse(auth.error, auth.status);
      query = auth.supabase.from("activities")
        .select("id, title, activity_type, description, activity_date, location, registration_open");
    } else {
      query = query.eq("registration_open", true)
        .gte("activity_date", new Date().toISOString().slice(0, 10));
    }
    const { data, error } = await query.order("activity_date", { ascending: true });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unable to load public activities:", error);
    return errorResponse("Daftar kegiatan tidak dapat dimuat. Periksa konfigurasi dan skema Supabase.", 503);
  }
}

export async function POST(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Data kegiatan tidak valid.", 400);
  }
  const activity = readActivity(body);
  if (!activity) return errorResponse("Lengkapi judul, jenis, deskripsi, tanggal, lokasi, dan status pendaftaran dengan benar.", 400);

  const { data, error } = await auth.supabase.from("activities")
    .insert({ ...activity, created_by: auth.user.id })
    .select("id, title, activity_type, description, activity_date, location, registration_open")
    .single();
  if (error) {
    console.error("Unable to create activity:", error);
    return errorResponse("Kegiatan gagal disimpan. Pastikan skema Supabase sudah diperbarui.");
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Data kegiatan tidak valid.", 400);
  }
  if (typeof body.id !== "string" || !body.id) return errorResponse("ID kegiatan wajib diisi.", 400);
  const activity = readActivity(body);
  if (!activity) return errorResponse("Periksa kembali data kegiatan.", 400);

  const { data, error } = await auth.supabase.from("activities")
    .update(activity)
    .eq("id", body.id)
    .select("id, title, activity_type, description, activity_date, location, registration_open")
    .maybeSingle();
  if (error) {
    console.error("Unable to update activity:", error);
    return errorResponse("Kegiatan gagal diperbarui.");
  }
  if (!data) return errorResponse("Kegiatan tidak ditemukan.", 404);
  return NextResponse.json(data);
}

export async function PATCH(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Data status pendaftaran tidak valid.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
    typeof body.id !== "string" || !body.id ||
    typeof body.registration_open !== "boolean") {
    return errorResponse("ID kegiatan dan status pendaftaran wajib diisi.", 400);
  }

  const { data, error } = await auth.supabase.from("activities")
    .update({ registration_open: body.registration_open })
    .eq("id", body.id)
    .select("id, registration_open")
    .maybeSingle();
  if (error) {
    console.error("Unable to update activity registration status:", error);
    return errorResponse("Status pendaftaran gagal diperbarui.");
  }
  if (!data) return errorResponse("Kegiatan tidak ditemukan.", 404);
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return errorResponse("ID kegiatan wajib diisi.", 400);
  const { data, error } = await auth.supabase.from("activities").delete().eq("id", id).select("id").maybeSingle();
  if (error) {
    console.error("Unable to delete activity:", error);
    return errorResponse("Kegiatan gagal dihapus.");
  }
  if (!data) return errorResponse("Kegiatan tidak ditemukan.", 404);
  return NextResponse.json({ deleted: true });
}
