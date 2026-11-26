import { createSupabaseServerClient } from "./server";

const imageBucket = "news-images";

function mapPost(supabase, post) {
  const imageUrl = post.image_path
    ? supabase.storage.from(imageBucket).getPublicUrl(post.image_path).data.publicUrl
    : null;

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: post.category,
    excerpt: post.excerpt,
    content: post.content,
    date: post.published_at,
    imageUrl,
    instagramUrl: post.instagram_url,
    instagramEmbedUrl: post.instagram_url ? `${post.instagram_url}embed/` : null,
  };
}

export function normalizeInstagramUrl(value) {
  if (value === null) return "";
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > 500) return null;

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(url.hostname)) return null;
  const match = url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)(?:\/embed)?\/?$/);
  if (!match) return null;
  return `https://www.instagram.com/${match[1]}/${match[2]}/`;
}

export async function getNews() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, category, excerpt, content, published_at, image_path, instagram_url")
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Supabase gagal memuat berita: ${error.message}`);
  return data.map((post) => mapPost(supabase, post));
}

export async function getNewsBySlug(slug) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, category, excerpt, content, published_at, image_path, instagram_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Supabase gagal memuat berita: ${error.message}`);
  return data ? mapPost(supabase, data) : null;
}

export { imageBucket };
