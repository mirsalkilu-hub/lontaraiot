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
    youtubeUrl: post.youtube_url,
    youtubeEmbedUrl: post.youtube_url
      ? `https://www.youtube-nocookie.com/embed/${new URL(post.youtube_url).searchParams.get("v")}`
      : null,
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

export function normalizeYouTubeUrl(value) {
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
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;

  const hostname = url.hostname.toLowerCase();
  const youtubeHosts = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"];
  let videoId = null;
  if (hostname === "youtu.be" || hostname === "www.youtu.be") {
    videoId = url.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1] || null;
  } else if (youtubeHosts.includes(hostname)) {
    videoId = url.pathname === "/watch"
      ? url.searchParams.get("v")
      : url.pathname.match(/^\/(embed|shorts|live)\/([A-Za-z0-9_-]{11})\/?$/)?.[2] || null;
  }
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function getNews() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, category, excerpt, content, published_at, image_path, instagram_url, youtube_url")
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Supabase gagal memuat berita: ${error.message}`);
  return data.map((post) => mapPost(supabase, post));
}

export async function getNewsBySlug(slug) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, category, excerpt, content, published_at, image_path, instagram_url, youtube_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Supabase gagal memuat berita: ${error.message}`);
  return data ? mapPost(supabase, data) : null;
}

export { imageBucket };
