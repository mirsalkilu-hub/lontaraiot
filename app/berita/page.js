import { getNews } from "../../lib/supabase/news";
import NewsCards from "../ui/news-cards";
import SiteFooter from "../ui/site-footer";
import SiteHeader from "../ui/site-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Semua Berita | LontaraIoT",
  description: "Jelajahi seluruh berita, cerita, dan kegiatan terbaru dari LontaraIoT.",
};

export default async function NewsArchivePage() {
  let news = [];
  let newsError = "";
  try {
    news = await getNews();
  } catch (error) {
    console.error("Unable to load news archive:", error);
    newsError = "Berita belum dapat dimuat. Pastikan konfigurasi Supabase dan skema database sudah disiapkan.";
  }

  return (
    <main className="news-archive-page">
      <SiteHeader />
      <section className="section news-section news-archive-section">
        <div className="section-top">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> ARSIP LONTARA / JOURNAL</p>
            <h1>Semua <span>berita.</span></h1>
          </div>
          <p className="section-intro">{news.length} berita dan cerita dari perjalanan LontaraIoT.</p>
        </div>
        {newsError
          ? <p className="empty-news" role="status">{newsError}</p>
          : news.length
            ? <NewsCards items={news} />
            : <p className="empty-news">Belum ada berita yang diposting.</p>}
      </section>
      <SiteFooter />
    </main>
  );
}
