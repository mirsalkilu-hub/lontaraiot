import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data", "news.json");
const uploadsDirectory = path.join(root, "data", "uploads");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Atur NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY untuk menjalankan migrasi.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const posts = JSON.parse(await readFile(sourcePath, "utf8"));

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "berita";
}

async function getAdminUserId() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const admin = data.users.find((user) => user.app_metadata?.role === "admin");
  if (!admin) throw new Error("Buat user admin di Supabase Auth dan tetapkan app_metadata.role = admin sebelum migrasi.");
  return admin.id;
}

const authorId = await getAdminUserId();
for (const post of posts) {
  const suffix = String(post.id).replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "legacy";
  const slug = `${slugify(post.title)}-${suffix}`.slice(0, 96);
  let imagePath = null;
  const legacyImage = typeof post.imageUrl === "string"
    ? post.imageUrl.match(/^\/api\/uploads\/([a-f0-9-]{36}\.(?:png|jpg|webp))$/)
    : null;

  if (legacyImage) {
    const imageBytes = await readFile(path.join(uploadsDirectory, legacyImage[1]));
    const extension = path.extname(legacyImage[1]).toLowerCase();
    const contentType = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
    imagePath = `legacy/${legacyImage[1]}`;
    const { error } = await supabase.storage
      .from("news-images")
      .upload(imagePath, imageBytes, { contentType, upsert: true });
    if (error) throw new Error(`Gagal memindahkan gambar "${post.title}": ${error.message}`);
  }

  const { error } = await supabase.from("posts").upsert({
    slug,
    title: post.title,
    category: post.category,
    excerpt: post.excerpt.slice(0, 220),
    content: post.content || post.excerpt,
    published_at: post.date,
    image_path: imagePath,
    author_id: authorId,
  }, { onConflict: "slug" });

  if (error) throw new Error(`Gagal memindahkan berita "${post.title}": ${error.message}`);
  console.log(`Migrated: ${post.title}`);
}

console.log(`Selesai memindahkan ${posts.length} berita.`);
