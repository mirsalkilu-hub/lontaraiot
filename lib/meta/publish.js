import { randomUUID } from "node:crypto";
import sharp from "sharp";

const graphVersion = "v27.0";

async function graphRequest(path, { token, method = "GET", params }) {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${path}`);
  const headers = { Authorization: `Bearer ${token}` };
  let body;

  if (method === "GET") {
    for (const [key, value] of Object.entries(params || {})) url.searchParams.set(key, value);
  } else {
    body = new URLSearchParams(params);
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.error) {
    throw new Error(result.error?.message || `Meta Graph API merespons HTTP ${response.status}.`);
  }
  return result;
}

function getCaption(post, articleUrl) {
  return `${post.title}\n\n${post.excerpt}\n\nBaca selengkapnya: ${articleUrl}`;
}

async function createInstagramJpeg(imageBytes) {
  const rotatedImage = await sharp(imageBytes).rotate().toBuffer();
  const { width, height } = await sharp(rotatedImage).metadata();
  if (!width || !height) throw new Error("Ukuran gambar Instagram tidak dapat dibaca.");

  const ratio = width / height;
  let canvasWidth;
  let canvasHeight;
  if (ratio < 0.8) {
    canvasHeight = Math.min(1440, Math.max(320, height));
    canvasWidth = Math.round(canvasHeight * 0.8);
  } else if (ratio > 1.91) {
    canvasWidth = Math.min(1440, Math.max(320, width));
    canvasHeight = Math.round(canvasWidth / 1.91);
  } else {
    const longestSide = Math.max(width, height);
    const scale = longestSide > 1440 ? 1440 / longestSide : longestSide < 320 ? 320 / longestSide : 1;
    canvasWidth = Math.round(width * scale);
    canvasHeight = Math.round(height * scale);
  }

  return sharp(rotatedImage)
    .resize(canvasWidth, canvasHeight, { fit: "contain", background: "#f3f6fb" })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function publishFacebook({ pageId, token, post, articleUrl, imageUrl }) {
  const caption = getCaption(post, articleUrl);
  const result = imageUrl
    ? await graphRequest(`${pageId}/photos`, {
      token,
      method: "POST",
      params: { url: imageUrl, caption, published: "true" },
    })
    : await graphRequest(`${pageId}/feed`, {
      token,
      method: "POST",
      params: { message: caption, link: articleUrl },
    });

  if (!result.id) throw new Error("Meta tidak mengembalikan ID posting Facebook.");
  return { status: "published", id: result.id };
}

async function publishInstagram({ pageId, token, post, articleUrl, imageUrl, imageBytes, supabase, imageBucket }) {
  if (!imageUrl || !imageBytes) {
    return { status: "skipped", reason: "Instagram memerlukan gambar; berita tanpa gambar hanya dibagikan ke Facebook." };
  }

  const page = await graphRequest(pageId, {
    token,
    params: { fields: "instagram_business_account{id,username}" },
  });
  const instagramAccount = page.instagram_business_account;
  if (!instagramAccount?.id) {
    throw new Error("Akun Instagram Professional belum terhubung ke Facebook Page ini.");
  }

  const expectedUsername = process.env.META_INSTAGRAM_USERNAME?.replace(/^@/, "").toLowerCase();
  if (expectedUsername && instagramAccount.username?.toLowerCase() !== expectedUsername) {
    throw new Error("Akun Instagram yang terhubung tidak cocok dengan META_INSTAGRAM_USERNAME.");
  }

  let instagramImageUrl = imageUrl;
  let temporaryImagePath = `social-jpeg/${randomUUID()}.jpg`;
  let temporaryImageUploaded = false;
  try {
    const jpeg = await createInstagramJpeg(imageBytes);
    const { error } = await supabase.storage
      .from(imageBucket)
      .upload(temporaryImagePath, jpeg, { contentType: "image/jpeg", upsert: false });
    if (error) throw new Error(`Gagal menyiapkan gambar Instagram: ${error.message}`);
    temporaryImageUploaded = true;
    instagramImageUrl = supabase.storage.from(imageBucket).getPublicUrl(temporaryImagePath).data.publicUrl;

    const container = await graphRequest(`${instagramAccount.id}/media`, {
      token,
      method: "POST",
      params: {
        image_url: instagramImageUrl,
        caption: getCaption(post, articleUrl).slice(0, 2200),
      },
    });
    if (!container.id) throw new Error("Meta tidak mengembalikan ID media Instagram.");

    const published = await graphRequest(`${instagramAccount.id}/media_publish`, {
      token,
      method: "POST",
      params: { creation_id: container.id },
    });
    if (!published.id) throw new Error("Meta tidak mengembalikan ID posting Instagram.");
    return { status: "published", id: published.id };
  } finally {
    if (temporaryImageUploaded) {
      const { error } = await supabase.storage.from(imageBucket).remove([temporaryImagePath]);
      if (error) console.error("Unable to remove temporary Instagram image:", error);
    }
  }
}

export async function publishToSocialMedia({ post, supabase, imageBucket, imagePath, imageBytes }) {
  const pageId = process.env.META_FACEBOOK_PAGE_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageId || !/^\d+$/.test(pageId) || !token) {
    return {
      configured: false,
      facebook: { status: "not_configured" },
      instagram: { status: "not_configured" },
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://lontaraiot.vercel.app").replace(/\/+$/, "");
  const articleUrl = `${siteUrl}/berita/${encodeURIComponent(post.slug)}`;
  const imageUrl = imagePath
    ? supabase.storage.from(imageBucket).getPublicUrl(imagePath).data.publicUrl
    : null;

  const publishFacebookResult = publishFacebook({ pageId, token, post, articleUrl, imageUrl })
    .then((result) => result)
    .catch((error) => {
      console.error("Unable to publish LontaraIoT news to Facebook:", error);
      return { status: "failed", error: error.message };
    });

  const publishInstagramResult = publishInstagram({
    pageId,
    token,
    post,
    articleUrl,
    imageUrl,
    imageBytes,
    supabase,
    imageBucket,
  }).then((result) => result).catch((error) => {
    console.error("Unable to publish LontaraIoT news to Instagram:", error);
    return { status: "failed", error: error.message };
  });

  const [facebook, instagram] = await Promise.all([publishFacebookResult, publishInstagramResult]);
  return { configured: true, facebook, instagram };
}
