"use client";

import { useEffect } from "react";
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

function RobotIllustration() {
  return (
    <div className="hero-art" aria-label="Animasi robot pintar dan teknologi">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <span className="art-spark spark-one" aria-hidden="true">✳</span>
      <span className="art-spark spark-two" aria-hidden="true">·</span>
      <div className="art-grid" />
      <div className="art-label label-top"><span className="pulse-dot" /> SYSTEM ONLINE</div>
      <div className="art-label label-bottom">MADE FOR TOMORROW <span>✳</span></div>
      <svg className="robot-svg" viewBox="0 0 420 450" role="img" aria-labelledby="robot-title robot-description">
        <title id="robot-title">Robot pintar dengan sensor bercahaya</title>
        <desc id="robot-description">Robot Lontara bergerak dan berkedip di antara orbit teknologi.</desc>
        <defs>
          <linearGradient id="body" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f7f9fd" /><stop offset="1" stopColor="#c6d6e8" /></linearGradient>
          <linearGradient id="face" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#123b72" /><stop offset="1" stopColor="#071d3b" /></linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g className="robot-character">
        <ellipse cx="215" cy="408" rx="118" ry="17" fill="#15292a" opacity=".14" />
        <path className="robot-legs" d="M142 292 122 365q-3 15 13 18l31 4 25-71m49-24 35 73q8 14 22 5l25-18-43-79" fill="url(#body)" stroke="#7993ad" strokeWidth="4" />
        <path d="M148 207q0-30 30-30h85q30 0 30 30v104q0 23-25 23h-95q-25 0-25-23z" fill="url(#body)" stroke="#7993ad" strokeWidth="4" />
        <path d="M164 222q0-15 17-15h78q16 0 16 15v43q0 16-17 16h-77q-17 0-17-16z" fill="#dce8f6" />
        <circle className="robot-heart" cx="205" cy="242" r="13" fill="#56d9c1" filter="url(#glow)" /><circle className="robot-heart robot-heart-right" cx="246" cy="242" r="13" fill="#56d9c1" filter="url(#glow)" />
        <path d="M204 272q20 13 42 0" fill="none" stroke="#547c9c" strokeWidth="4" strokeLinecap="round" />
        <g className="robot-arms"><path d="m147 224-47 20q-12 5-7 18l20 56q5 14 20 8l19-9m143-95 48 20q12 5 7 18l-21 56q-5 14-20 8l-18-9" fill="url(#body)" stroke="#7993ad" strokeWidth="4" /></g>
        <rect x="177" y="115" width="78" height="83" rx="27" fill="url(#body)" stroke="#7993ad" strokeWidth="4" /><rect x="169" y="127" width="95" height="61" rx="23" fill="url(#face)" />
        <circle className="robot-eye" cx="196" cy="156" r="7" fill="#ffae35" filter="url(#glow)" /><circle className="robot-eye robot-eye-right" cx="237" cy="156" r="7" fill="#ffae35" filter="url(#glow)" />
        <path d="M215 115V94m-12 0h24" stroke="#7993ad" strokeWidth="5" strokeLinecap="round" /><circle className="robot-antenna" cx="215" cy="87" r="7" fill="#f39200" filter="url(#glow)" />
        <rect x="193" y="331" width="46" height="11" rx="5" fill="#6f89a1" />
        <path d="m168 366-15 26q-5 10 8 13h54q14-3 8-15l-9-24m32 0 20 25q8 11 19 3l34-25q8-10-1-18l-15-13" fill="url(#body)" stroke="#7993ad" strokeWidth="4" />
        </g>
      </svg>
      <div className="art-chip chip-left"><span className="chip-icon">⌁</span><span>SMART<br />SYSTEM</span></div>
      <div className="art-chip chip-right"><span className="chip-icon">✳</span><span>IDEA →<br />IMPACT</span></div>
    </div>
  );
}

function NewsSection({ news, error }) {
  return (
    <section className="section news-section" id="berita">
      <div className="section-top" data-reveal="up">
        <div><p className="eyebrow"><span className="eyebrow-line" /> CERITA TERBARU</p><h2>Kabar dari<br />ruang <span>kreasi.</span></h2></div>
        <p className="section-intro">Ikuti cerita, kegiatan, dan ide baru dari perjalanan belajar teknologi bersama LontaraIoT.</p>
      </div>
      {error ? <p className="empty-news" role="status">{error}</p> : news.length ? <div className="news-grid">
        {news.slice(0, 3).map((item, index) => (
          <article className={`news-card news-card-${index + 1}`} key={item.id} data-reveal="up" style={{ "--reveal-delay": `${index * 110}ms` }}>
            <a className="news-card-link" href={`/berita/${encodeURIComponent(item.slug)}`} aria-label={`Baca berita: ${item.title}`}>
              <div className={item.imageUrl ? "news-art news-art-with-photo" : "news-art"}>{item.imageUrl ? <img className="news-photo" src={item.imageUrl} alt="" /> : <span className="news-art-shape">{index === 0 ? "⌘" : index === 1 ? "◈" : "✳"}</span>}<span className="news-art-index">0{index + 1}</span><span className="news-art-caption">LONTARA / JOURNAL</span></div>
              <div className="news-copy"><div className="news-meta"><span>{item.category}</span><time dateTime={item.date}>{new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</time></div><h3>{item.title}</h3><p>{item.excerpt}</p><span className="news-read-more">Baca selengkapnya <ArrowIcon /></span></div>
            </a>
          </article>
        ))}
      </div> : <p className="empty-news">Berita baru sedang disiapkan. Kunjungi lagi segera!</p>}
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
            <h1>Belajar hari ini.<br />Bentuk <span>masa depan.</span></h1>
            <p className="hero-description">Ruang belajar teknologi yang berakar pada kearifan, bergerak dengan inovasi, dan tumbuh bersama generasi pencipta.</p>
            <div className="hero-actions"><a className="button button-dark" href="#program">Jelajahi program <ArrowIcon /></a><a className="button button-quiet" href="#tentang">Kenali Lontara <span>↓</span></a></div>
            <div className="hero-note"><span className="note-star">✳</span><span>Berakar pada kearifan,<br />bergerak dengan inovasi.</span></div>
          </div>
          <div data-reveal="scale"><RobotIllustration /></div>
          <div className="hero-foot"><span>01 — BELAJAR DENGAN MEMBUAT</span><span>MAKASSAR, INDONESIA <span className="pulse-dot" /></span></div>
        </section>

        <section className="manifesto" id="tentang">
          <div className="manifesto-side"><p className="eyebrow"><span className="eyebrow-line" /> TENTANG LONTARA</p><span className="manifesto-symbol">L<span>✳</span></span></div>
          <div className="manifesto-copy" data-reveal="right"><h2>Nama yang membawa<br />sebuah <span>cara pandang.</span></h2><p>LONTARA adalah <strong>Pembelajaran | Berorientasi | Terhubung | Teknologi | Adaptif | Responsif | Canggih</strong> untuk Masa Depan yang Berkelanjutan. Kami percaya setiap anak muda punya potensi untuk memahami teknologi — dan menciptakan sesuatu yang berarti dengannya.</p><a className="text-link" href="#program">Temukan cara kami belajar <ArrowIcon /></a></div>
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

      <SiteFooter />
    </>
  );
}
