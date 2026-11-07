import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSupabase } from "../../../lib/supabase/server";
import { getNews, imageBucket } from "../../../lib/supabase/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const maxImageSize = 5 * 1024 * 1024;
const allowedImages = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const allowedCategories = ["Program", "Kegiatan", "Inspirasi", "Pengumuman"];

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "berita";
}

function identifyImage(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

function errorResponse(error, status = 500) {
  return NextResponse.json({ error }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await getNews());
  } catch (error) {
    console.error("Unable to load Supabase news:", error);
    return errorResponse("Berita tidak dapat dimuat. Periksa konfigurasi dan skema Supabase.", 503);
  }
}

export async function POST(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  let formData;
  try {
    if (Number(request.headers.get("content-length")) > maxImageSize + 64 * 1024) {
      return errorResponse("Ukuran unggahan maksimal 5 MB.", 413);
    }
    formData = await request.formData();
  } catch {
    return errorResponse("Data berita tidak valid.", 400);
  }

  const title = formData.get("title");
  const category = formData.get("category");
  const excerpt = formData.get("excerpt");
  const content = formData.get("content");
  const date = formData.get("date");
  const image = formData.get("image");

  if (typeof title !== "string" || !title.trim() || title.trim().length > 120 ||
    typeof category !== "string" || !allowedCategories.includes(category) ||
    typeof excerpt !== "string" || !excerpt.trim() || excerpt.trim().length > 220 ||
    typeof content !== "string" || !content.trim() || content.trim().length > 50000 ||
    typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    return errorResponse("Lengkapi judul, kategori, tanggal, ringkasan, dan isi berita dengan benar.", 400);
  }

  if (image && typeof image !== "string" && image.size > maxImageSize) {
    return errorResponse("Ukuran gambar maksimal 5 MB.", 413);
  }
  if (image && typeof image === "string") return errorResponse("Lampiran gambar tidak valid.", 400);

  const supabase = auth.supabase;
  let imagePath = null;
  let postInserted = false;
  let imageBytes = null;
  try {
    if (image?.size) {
      imageBytes = Buffer.from(await image.arrayBuffer());
      const detectedType = identifyImage(imageBytes);
      if (!detectedType || detectedType !== image.type || !allowedImages.has(detectedType)) {
        return errorResponse("Format gambar harus JPEG, PNG, atau WebP yang valid.", 400);
      }
      imagePath = `${randomUUID()}.${allowedImages.get(detectedType)}`;
      const { error } = await supabase.storage
        .from(imageBucket)
        .upload(imagePath, imageBytes, { contentType: detectedType, upsert: false });
      if (error) throw error;
    }

    const slug = `${slugify(title)}-${randomUUID().slice(0, 8)}`;
    const post = {
      slug,
      title: title.trim(),
      category,
      excerpt: excerpt.trim(),
      content: content.trim(),
      published_at: date,
      image_path: imagePath,
      author_id: auth.user.id,
    };
    const { error } = await supabase.from("posts").insert(post);
    if (error) throw error;
    postInserted = true;

    const news = await getNews();
    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error("Unable to publish Supabase news:", error);
    if (!postInserted && imagePath) {
      const { error: cleanupError } = await supabase.storage.from(imageBucket).remove([imagePath]);
      if (cleanupError) console.error("Unable to remove orphaned Supabase image:", cleanupError);
    }
    return postInserted
      ? errorResponse("Berita sudah tersimpan, tetapi respons gagal dimuat. Muat ulang halaman admin.", 503)
      : errorResponse("Berita gagal diterbitkan. Periksa tabel dan bucket Supabase.");
  }
}

export async function PUT(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  let formData;
  try {
    if (Number(request.headers.get("content-length")) > maxImageSize + 64 * 1024) {
      return errorResponse("Ukuran unggahan maksimal 5 MB.", 413);
    }
    formData = await request.formData();
  } catch {
    return errorResponse("Data berita tidak valid.", 400);
  }

  const id = formData.get("id");
  const title = formData.get("title");
  const category = formData.get("category");
  const excerpt = formData.get("excerpt");
  const content = formData.get("content");
  const date = formData.get("date");
  const image = formData.get("image");
  const removeImage = formData.get("removeImage") === "true";

  if (typeof id !== "string" || !id ||
    typeof title !== "string" || !title.trim() || title.trim().length > 120 ||
    typeof category !== "string" || !allowedCategories.includes(category) ||
    typeof excerpt !== "string" || !excerpt.trim() || excerpt.trim().length > 220 ||
    typeof content !== "string" || !content.trim() || content.trim().length > 50000 ||
    typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    return errorResponse("Data berita tidak valid. Periksa kembali semua kolom.", 400);
  }

  if (image && typeof image !== "string" && image.size > maxImageSize) {
    return errorResponse("Ukuran gambar maksimal 5 MB.", 413);
  }
  if (image && typeof image === "string") return errorResponse("Lampiran gambar tidak valid.", 400);

  const supabase = auth.supabase;
  const { data: existingPost, error: findError } = await supabase
    .from("posts")
    .select("id, image_path")
    .eq("id", id)
    .maybeSingle();
  if (findError) {
    console.error("Unable to find Supabase news for editing:", findError);
    return errorResponse("Berita gagal diperbarui.");
  }
  if (!existingPost) return errorResponse("Berita tidak ditemukan.", 404);

  let imagePath = existingPost.image_path;
  let uploadedImagePath = null;
  let postUpdated = false;
  try {
    if (image?.size) {
      const imageBytes = Buffer.from(await image.arrayBuffer());
      const detectedType = identifyImage(imageBytes);
      if (!detectedType || detectedType !== image.type || !allowedImages.has(detectedType)) {
        return errorResponse("Format gambar harus JPEG, PNG, atau WebP yang valid.", 400);
      }
      uploadedImagePath = `${randomUUID()}.${allowedImages.get(detectedType)}`;
      const { error } = await supabase.storage
        .from(imageBucket)
        .upload(uploadedImagePath, imageBytes, { contentType: detectedType, upsert: false });
      if (error) throw error;
      imagePath = uploadedImagePath;
    } else if (removeImage) {
      imagePath = null;
    }

    const { error } = await supabase
      .from("posts")
      .update({
        title: title.trim(),
        category,
        excerpt: excerpt.trim(),
        content: content.trim(),
        published_at: date,
        image_path: imagePath,
      })
      .eq("id", id);
    if (error) throw error;
    postUpdated = true;

    if (existingPost.image_path && existingPost.image_path !== imagePath) {
      const { error: cleanupError } = await supabase.storage.from(imageBucket).remove([existingPost.image_path]);
      if (cleanupError) console.error("Unable to remove replaced Supabase news image:", cleanupError);
    }
    return NextResponse.json(await getNews());
  } catch (error) {
    console.error("Unable to update Supabase news:", error);
    if (!postUpdated && uploadedImagePath) {
      const { error: cleanupError } = await supabase.storage.from(imageBucket).remove([uploadedImagePath]);
      if (cleanupError) console.error("Unable to remove orphaned Supabase image:", cleanupError);
    }
    return postUpdated
      ? errorResponse("Berita sudah diperbarui, tetapi daftar gagal dimuat. Muat ulang halaman admin.", 503)
      : errorResponse("Berita gagal diperbarui. Periksa tabel dan bucket Supabase.");
  }
}

export async function DELETE(request) {
  const auth = await getAdminSupabase(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return errorResponse("ID berita wajib diisi.", 400);

  const supabase = auth.supabase;
  const { data: post, error: findError } = await supabase
    .from("posts")
    .select("id, image_path")
    .eq("id", id)
    .maybeSingle();
  if (findError) {
    console.error("Unable to find Supabase news for deletion:", findError);
    return errorResponse("Berita gagal dihapus.");
  }
  if (!post) return errorResponse("Berita tidak ditemukan.", 404);

  const { error: deleteError } = await supabase.from("posts").delete().eq("id", id);
  if (deleteError) {
    console.error("Unable to delete Supabase news:", deleteError);
    return errorResponse("Berita gagal dihapus.");
  }

  if (post.image_path) {
    const { error } = await supabase.storage.from(imageBucket).remove([post.image_path]);
    if (error) console.error("Unable to remove deleted Supabase news image:", error);
  }
  return NextResponse.json(await getNews());
}
