"use client";

import { useEffect, useState } from "react";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";

const values = [
  { number: "01", title: "Pembelajaran", description: "Belajar dengan praktik, eksplorasi, dan rasa ingin tahu." },
  { number: "02", title: "Berorientasi", description: "Menyusun langkah nyata untuk masa depan yang lebih baik." },
  { number: "03", title: "Terhubung", description: "Menghubungkan manusia, ide, dan teknologi." },
  { number: "04", title: "Teknologi", description: "Menguasai IoT dan robotika melalui pengalaman langsung." },
  { number: "05", title: "Adaptif", description: "Tumbuh bersama perubahan dan tantangan zaman." },
  { number: "06", title: "Responsif", description: "Peka terhadap kebutuhan dan potensi di sekitar." },
  { number: "07", title: "Canggih", description: "Menciptakan inovasi untuk masa depan berkelanjutan." },
];

const programs = [
  { icon: "⌘", title: "Internet of Things", text: "Kenali sensor, mikrokontroler, dan cara perangkat saling terhubung.", tag: "KONEKTIVITAS" },
  { icon: "◈", title: "Robotika", text: "Rancang robot yang bergerak, merespons, dan menyelesaikan tantangan.", tag: "REKAYASA" },
  { icon: "⌁", title: "Kreasi Teknologi", text: "Ubah rasa ingin tahu menjadi proyek yang berdampak bagi sekitar.", tag: "INOVASI" },
];

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function HeroPoster() {
  return (
    <div className="hero-art">
      <img
        className="hero-poster"
        src="/lontara-welcoming-poster.png"
        alt="Poster Selamat Datang Para Habibie Muda di Lontara IoT & Robotics Bootcamp"
      />
    </div>
  );
}

function PartnerLogos() {
  return (
    <div className="hero-partners" aria-label="Mitra pendukung">
      <span className="footer-label">DIDUKUNG OLEH</span>
      <div className="hero-partner-logos">
        <img src="/logo-danantara.webp" alt="Danantara Indonesia" />
        <img src="/logo-sulawesi-selatan.png" alt="Sulawesi Selatan" />
        <img src="/logo-bpsdm.png" alt="BPSDM Sulawesi Selatan" />
        <img src="/logo-telkom-indonesia.png" alt="Telkom Indonesia" />
      </div>
    </div>
  );
}

function NewsSection({ news, error }) {
  const [search, setSearch] = useState("");
  const latestNews = news.slice(0, 6);
  const normalizedSearch = search.trim().toLocaleLowerCase("id-ID");
  const filteredNews = latestNews.filter((item) =>
    [item.title, item.category, item.excerpt, item.date]
      .some((value) => value?.toLocaleLowerCase("id-ID").includes(normalizedSearch)),
  );

  return (
    <section className="section news-section" id="berita">
      <div className="section-top" data-reveal="up">
        <div><p className="eyebrow"><span className="eyebrow-line" /> CERITA TERBARU</p><h2>Kabar dari<br />ruang <span>kreasi.</span></h2></div>
        <p className="section-intro">Ikuti cerita, kegiatan, dan ide baru dari perjalanan belajar teknologi bersama LontaraIoT.</p>
      </div>
      {!error && latestNews.length > 0 && (
        <div className="news-search">
          <label htmlFor="news-search">Cari berita</label>
          <input
            id="news-search"
            type="search"
            placeholder="Judul, kategori, ringkasan, atau tanggal"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}
      {error ? <p className="empty-news" role="status">{error}</p> : latestNews.length ? filteredNews.length ? <div className="news-grid">
        {filteredNews.map((item, index) => (
          <article className={`news-card news-card-${index + 1}`} key={item.id} data-reveal="up" style={{ "--reveal-delay": `${index * 110}ms` }}>
            <a className="news-card-link" href={`/berita/${encodeURIComponent(item.slug)}`} aria-label={`Baca berita: ${item.title}`}>
              <div className={item.imageUrl ? "news-art news-art-with-photo" : "news-art"}>{item.imageUrl ? <img className="news-photo" src={item.imageUrl} alt="" /> : <span className="news-art-shape">{index === 0 ? "⌘" : index === 1 ? "◈" : "✳"}</span>}<span className="news-art-index">0{index + 1}</span><span className="news-art-caption">LONTARA / JOURNAL</span></div>
              <div className="news-copy"><div className="news-meta"><span>{item.category}</span><time dateTime={item.date}>{new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</time></div><h3>{item.title}</h3><p>{item.excerpt}</p><span className="news-read-more">Baca selengkapnya <ArrowIcon /></span></div>
            </a>
          </article>
        ))}
      </div> : <p className="empty-news" role="status">Tidak ada berita yang cocok dengan pencarian.</p> : <p className="empty-news">Berita baru sedang disiapkan. Kunjungi lagi segera!</p>}
      <a className="text-link" href="/admin">Kelola berita <ArrowIcon /></a>
    </section>
  );
}

export default function HomePage({ news, newsError }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("motion-ready");

    const revealElements = document.querySelectorAll("[data-reveal]");
    const revealObserver = "IntersectionObserver" in window
      ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -45px 0px" })
      : null;

    revealElements.forEach((element) => {
      if (revealObserver) revealObserver.observe(element);
      else element.classList.add("is-visible");
    });

    let frame = 0;
    const updateScrollProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollableHeight = root.scrollHeight - window.innerHeight;
        const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
        root.style.setProperty("--scroll-progress", String(Math.min(1, Math.max(0, progress))));
      });
    };

    updateScrollProgress();
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);

    return () => {
      revealObserver?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollProgress);
      window.removeEventListener("resize", updateScrollProgress);
      root.classList.remove("motion-ready");
      root.style.removeProperty("--scroll-progress");
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <SiteHeader home />

      <main>
        <section className="hero">
          <div className="hero-content" data-reveal="up">
            <p className="eyebrow"><span className="eyebrow-line" /> LONTARA IoT & ROBOTIC BOOTCAMPS</p>
            <h1>LONTARA IoT & <br />ROBOTICS <span>BOOTCAMP 2026.</span></h1>
            <p className="hero-description">
              <span className="hero-description-lead">Think. Build. Innovate. Shape the Future</span>
              <br />
              Bukan sekadar belajar teknologi. Saatnya menjadi pencipta inovasi!
              <br />
              Bergabunglah dalam pengalaman belajar intensif Internet of Things (IoT) dan Robotika. Eksplorasi teknologi, rakit perangkat, tulis kode, bangun prototipe, dan buktikan kreativitasmu melalui kompetisi inovasi teknologi.
              <br />
              19 dan 23–25 November 2026
              <br />
              Kota Parepare, Sulawesi Selatan.
            </p>
            <div className="hero-actions"><a className="button button-dark" href="#program">Jelajahi program <ArrowIcon /></a><a className="button button-quiet" href="#tentang">Kenali Lontara <span>↓</span></a></div>
            <div className="hero-note"><span className="note-star">✳</span><span>Berakar pada kearifan,<br />bergerak dengan inovasi.</span></div>
            <PartnerLogos />
          </div>
          <div data-reveal="scale"><HeroPoster /></div>
          <div className="hero-foot"><span>01 — BELAJAR DENGAN MEMBUAT</span><span>MAKASSAR, INDONESIA <span className="pulse-dot" /></span></div>
        </section>

        <section className="manifesto" id="tentang">
          <div className="manifesto-side">
            <p className="eyebrow"><span className="eyebrow-line" /> TENTANG LONTARA</p>
            <div className="manifesto-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/DgFmubs5kNo"
                title="Video Lontara IoT & Robotics Bootcamp"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
          <div className="manifesto-copy" data-reveal="right"><h2>LONTARA IoT &<br />Robotics <span>Bootcamp 2026.</span></h2><p>merupakan program pengembangan talenta teknologi muda Sulawesi Selatan yang dirancang untuk membekali siswa SMK dengan pengetahuan, keterampilan, kreativitas, dan pengalaman nyata dalam bidang  <strong>Internet of Things (IoT) dan Robotika.</strong></p><a className="text-link" href="#program">Temukan cara kami belajar <ArrowIcon /></a></div>
        </section>

        <section className="section program-section" id="program">
          <div className="section-top" data-reveal="up"><div><p className="eyebrow"><span className="eyebrow-line" /> BELAJAR LEWAT KARYA</p><h2>Ide besar dimulai<br />dari <span>rasa ingin tahu.</span></h2></div><p className="section-intro">Dari rangkaian pertama hingga prototipe yang bekerja. Belajar teknologi jadi pengalaman yang nyata, kolaboratif, dan menyenangkan.</p></div>
          <div className="program-grid">{programs.map((program, index) => <article className="program-card" key={program.title} data-reveal="up" style={{ "--reveal-delay": `${index * 110}ms` }}><div className="program-card-top"><span className="program-number">0{index + 1} / 03</span><span className="program-arrow"><ArrowIcon /></span></div><span className="program-icon">{program.icon}</span><p className="program-tag">{program.tag}</p><h3>{program.title}</h3><p className="program-text">{program.text}</p></article>)}</div>
        </section>

        <section className="values-strip" aria-label="Nilai-nilai Lontara">
          <div className="values-heading" data-reveal="left"><p className="eyebrow"><span className="eyebrow-line" /> ARTI DI BALIK NAMA</p><h2>Tujuh nilai.<br /><span>Satu arah.</span></h2><p>Untuk masa depan yang berkelanjutan.</p></div>
          <div className="values-list">{values.map((value, index) => <div className="value-row" key={value.number} data-reveal="right" style={{ "--reveal-delay": `${index * 65}ms` }}><span>{value.number}</span><h3>{value.title}</h3><p>{value.description}</p><span className="value-plus">+</span></div>)}</div>
        </section>

        <NewsSection news={news} error={newsError} />

        <section className="contact-banner" id="kontak" data-reveal="up"><div className="contact-star">✳</div><div><p className="eyebrow"><span className="eyebrow-line" /> MASA DEPAN DIMULAI DARI SINI</p><h2>Punya ide? Ayo<br /><span>wujudkan bersama.</span></h2></div><a className="button button-light" href="mailto:hello@lontaraiot.id">Hubungi kami <ArrowIcon /></a><div className="contact-orbit" /></section>
      </main>

      <div className="mobile-partners">
        <PartnerLogos />
      </div>
      <SiteFooter />
    </>
  );
}
