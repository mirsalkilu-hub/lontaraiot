import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2]?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Atur NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local.");
}

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Gunakan: npm run admin:promote -- email-admin@example.com");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const normalizedEmail = email.toLocaleLowerCase("en-US");
const perPage = 1000;
let page = 1;
let targetUser = null;

while (!targetUser) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) throw new Error(`Gagal mencari pengguna Supabase: ${error.message}`);

  targetUser = data.users.find((user) => user.email?.toLocaleLowerCase("en-US") === normalizedEmail);
  if (targetUser || data.users.length < perPage) break;
  page += 1;
}

if (!targetUser) {
  throw new Error(`Akun ${email} tidak ditemukan. Buat akun tersebut di Supabase Authentication → Users terlebih dahulu.`);
}

if (targetUser.app_metadata?.role === "admin") {
  console.log(`Akun ${email} sudah memiliki akses admin.`);
} else {
  const { error } = await supabase.auth.admin.updateUserById(targetUser.id, {
    app_metadata: { ...targetUser.app_metadata, role: "admin" },
  });

  if (error) throw new Error(`Gagal memberikan akses admin: ${error.message}`);
  console.log(`Akses admin berhasil diberikan kepada ${email}. Logout lalu login kembali agar sesi diperbarui.`);
}
