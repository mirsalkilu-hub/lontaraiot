import HomePage from "./ui/home-page";
import { getNews } from "../lib/supabase/news";

export const dynamic = "force-dynamic";

export default async function Page() {
  let news = [];
  let newsError = "";
  try {
    news = await getNews();
  } catch (error) {
    console.error("Unable to load news:", error);
    newsError = "Berita belum dapat dimuat. Pastikan konfigurasi Supabase dan skema database sudah disiapkan.";
  }

  return <HomePage news={news} newsError={newsError} />;
}
