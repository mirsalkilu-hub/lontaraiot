import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsBySlug } from "../../../lib/supabase/news";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const article = await getNewsBySlug(slug);
    if (!article) return { title: "Berita tidak ditemukan | LontaraIoT" };
    return {
      title: `${article.title} | LontaraIoT`,
      description: article.excerpt,
      openGraph: {
        title: article.title,
        description: article.excerpt,
        ...(article.imageUrl ? { images: [article.imageUrl] } : {}),
      },
    };
  } catch (error) {
    console.error("Unable to load news metadata:", error);
    return { title: "Berita | LontaraIoT" };
  }
}

export default async function NewsArticlePage({ params }) {
  const { slug } = await params;
  let article;
  try {
    article = await getNewsBySlug(slug);
  } catch (error) {
    console.error("Unable to load news article:", error);
    throw error;
  }
  if (!article) notFound();

  const formattedDate = new Date(`${article.date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="article-page">
      <header className="article-header">
        <Link className="brand" href="/" aria-label="LontaraIoT beranda">
          <img className="brand-logo" src="/lontara-logo.png" alt="Lontara IoT & Robotics Bootcamp" />
        </Link>
        <Link className="article-back" href="/#berita">← Semua berita</Link>
      </header>
      <article className="article-content">
        <Link className="article-back article-back-mobile" href="/#berita">← Semua berita</Link>
        <div className="article-heading">
          <div className="article-meta"><span>{article.category}</span><time dateTime={article.date}>{formattedDate}</time></div>
          <h1>{article.title}</h1>
          <p className="article-excerpt">{article.excerpt}</p>
        </div>
        {article.imageUrl && <img className="article-image" src={article.imageUrl} alt={article.title} />}
        <div className="article-body">
          {article.content.split(/\n\s*\n/).map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
          ))}
        </div>
        <Link className="text-link article-return" href="/#berita">Kembali ke semua berita <span aria-hidden="true">↗</span></Link>
      </article>
      <footer className="article-footer">© {new Date().getFullYear()} LontaraIoT · Belajar, berkarya, bertumbuh.</footer>
    </main>
  );
}
