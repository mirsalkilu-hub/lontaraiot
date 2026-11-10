import Link from "next/link";
import { notFound } from "next/navigation";
import { getNewsBySlug } from "../../../lib/supabase/news";
import SiteFooter from "../../ui/site-footer";
import SiteHeader from "../../ui/site-header";

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
      <SiteHeader />
      <article className="article-content">
        <header className="article-heading">
          <Link className="article-back" href="/#berita"><span aria-hidden="true">←</span> Semua berita</Link>
          <p className="article-kicker"><span className="eyebrow-line" /> LONTARA / JOURNAL</p>
          <div className="article-meta"><span>{article.category}</span><span className="article-meta-dot" aria-hidden="true" /><time dateTime={article.date}>{formattedDate}</time></div>
          <h1>{article.title}</h1>
          <p className="article-excerpt">{article.excerpt}</p>
        </header>
        {article.imageUrl && (
          <figure className="article-image-wrap">
            <img className="article-image" src={article.imageUrl} alt={article.title} />
          </figure>
        )}
        <div className="article-body">
          {article.content.split(/\n\s*\n/).map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
          ))}
        </div>
        <footer className="article-end">
          <span className="article-end-label"><span aria-hidden="true">✳</span> AKHIR CERITA</span>
          <Link className="text-link article-return" href="/#berita">Jelajahi berita lainnya <span aria-hidden="true">↗</span></Link>
        </footer>
      </article>
      <SiteFooter />
    </main>
  );
}
