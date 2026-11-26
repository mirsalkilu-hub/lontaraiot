function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export default function NewsCards({ items, reveal = false, autoplay = false }) {
  return (
    <div className="news-grid">
      {items.map((item, index) => (
        <article
          className={`news-card news-card-${index + 1}`}
          key={item.id}
          {...(reveal ? { "data-reveal": "up", style: { "--reveal-delay": `${index * 110}ms` } } : {})}
        >
          {item.instagramEmbedUrl || item.youtubeEmbedUrl ? (
            <div className="news-art news-art-with-video">
              <div className="news-instagram-topline"><span>{item.youtubeEmbedUrl ? "YOUTUBE / VIDEO" : "INSTAGRAM / REEL"}</span><span aria-hidden="true">↗</span></div>
              <iframe
                src={item.youtubeEmbedUrl
                  ? `${item.youtubeEmbedUrl}${autoplay ? "?autoplay=1&mute=1&playsinline=1" : ""}`
                  : `${item.instagramEmbedUrl}${autoplay ? "?autoplay=1&mute=1" : ""}`}
                title={`${item.youtubeEmbedUrl ? "Video YouTube" : "Postingan Instagram"}: ${item.title}`}
                loading="lazy"
                allow="autoplay; encrypted-media; picture-in-picture; accelerometer; clipboard-write"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : item.imageUrl ? (
            <a className="news-art news-art-link news-art-with-photo" href={`/berita/${encodeURIComponent(item.slug)}`} aria-label={`Baca berita: ${item.title}`}>
              <span className="news-photo-backdrop" style={{ backgroundImage: `url("${item.imageUrl}")` }} aria-hidden="true" />
              <img className="news-photo" src={item.imageUrl} alt="" />
              <span className="news-art-index">0{index + 1}</span><span className="news-art-caption">LONTARA / JOURNAL</span>
            </a>
          ) : (
            <a className="news-art news-art-link" href={`/berita/${encodeURIComponent(item.slug)}`} aria-label={`Baca berita: ${item.title}`}>
              <span className="news-art-shape">{index === 0 ? "⌘" : index === 1 ? "◈" : "✳"}</span>
              <span className="news-art-index">0{index + 1}</span><span className="news-art-caption">LONTARA / JOURNAL</span>
            </a>
          )}
          <a className="news-copy-link" href={`/berita/${encodeURIComponent(item.slug)}`} aria-label={`Baca berita: ${item.title}`}>
            <div className="news-copy">
              <div className="news-meta">
                <span>{item.category}</span>
                <time dateTime={item.date}>{new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</time>
              </div>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
              <span className="news-read-more">Baca selengkapnya <ArrowIcon /></span>
            </div>
          </a>
        </article>
      ))}
    </div>
  );
}
