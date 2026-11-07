"use client";

import { useState } from "react";

export default function SiteHeader({ home = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sectionHref = (section) => home ? `#${section}` : `/#${section}`;
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="LontaraIoT beranda">
        <img className="brand-logo" src="/lontara-logo.png" alt="Lontara IoT & Robotics Bootcamp" />
      </a>
      <button className="menu-toggle" type="button" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
        <span /><span />
      </button>
      <nav className={menuOpen ? "main-nav nav-open" : "main-nav"} aria-label="Navigasi utama">
        <a href={sectionHref("tentang")} onClick={closeMenu}>Tentang</a>
        <a href={sectionHref("program")} onClick={closeMenu}>Program</a>
        <a href={sectionHref("berita")} onClick={closeMenu}>Berita</a>
        <a className="nav-cta" href={sectionHref("kontak")} onClick={closeMenu}>Mulai jelajah <span aria-hidden="true">↗</span></a>
      </nav>
    </header>
  );
}
