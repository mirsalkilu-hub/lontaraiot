import { NextResponse } from "next/server";
import { createSupabaseServerClient, getAdminSupabase } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

function errorResponse(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Data pendaftaran tidak valid.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("Data pendaftaran tidak valid.", 400);
  }

  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const gender = typeof body.gender === "string" ? body.gender.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const organization = typeof body.organization === "string" ? body.organization.trim() : "";
  if (typeof body.activity_id !== "string" || !body.activity_id ||
    !fullName || fullName.length > 120 ||
    !["Laki-laki", "Perempuan", "Memilih tidak menjawab"].includes(gender) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
    !phone || phone.length > 40 || !/\d/.test(phone) ||
    !organization || organization.length > 160) {
    return errorResponse("Lengkapi kegiatan, nama, email, nomor telepon, dan asal sekolah/instansi dengan benar.", 400);
  }

  try {
    const supabase = createSupabaseServerClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("id")
      .eq("id", body.activity_id)
      .eq("registration_open", true)
      .gte("activity_date", today)
      .maybeSingle();
    if (activityError) throw activityError;
    if (!activity) return errorResponse("Kegiatan tidak tersedia atau pendaftarannya sudah ditutup.", 409);

    const { error } = await supabase.from("registrations").insert({
      activity_id: body.activity_id,
      full_name: fullName,
      gender,
      email,
      phone,
      organization,
    });
    if (error?.code === "23505") return errorResponse("Email ini sudah terdaftar pada kegiatan tersebut.", 409);
    if (error) throw error;
    return NextResponse.json({ registered: true }, { status: 201 });
  } catch (error) {
    console.error("Unable to register participant:", error);
    return errorResponse("Pendaftaran gagal diproses. Pastikan skema Supabase sudah diperbarui.", 503);
  }
}

export async function GET(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { data, error } = await auth.supabase
    .from("registrations")
    .select("id, activity_id, full_name, gender, email, phone, organization, created_at, activities(title, activity_date)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Unable to load activity registrations:", error);
    return errorResponse("Daftar peserta gagal dimuat.");
  }
  return NextResponse.json(data);
}
