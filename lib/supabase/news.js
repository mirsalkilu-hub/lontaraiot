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
  };
}

export async function getNews() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, category, excerpt, content, published_at, image_path")
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Supabase gagal memuat berita: ${error.message}`);
  return data.map((post) => mapPost(supabase, post));
}

export async function getNewsBySlug(slug) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, slug, title, category, excerpt, content, published_at, image_path")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Supabase gagal memuat berita: ${error.message}`);
  return data ? mapPost(supabase, data) : null;
}

export { imageBucket };
