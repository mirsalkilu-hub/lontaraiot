export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main" data-reveal="up">
        <div className="footer-about">
          <a className="brand brand-footer" href="/" aria-label="LontaraIoT beranda">
            <img className="brand-logo" src="/lontara-logo.png" alt="Lontara IoT & Robotics Bootcamp" />
          </a>
          <p>Berakar pada kearifan,<br />bergerak dengan inovasi,<br />menuju masa depan.</p>
        </div>
        <div className="footer-column">
          <span className="footer-label">JELAJAHI</span>
          <a href="/#tentang">Tentang kami</a>
          <a href="/#program">Program belajar</a>
          <a href="/#berita">Kabar terbaru</a>
        </div>
        <div className="footer-column">
          <span className="footer-label">TERHUBUNG</span>
          <a href="mailto:hello@lontaraiot.id">hello@lontaraiot.id</a>
          <a href="/#kontak">Makassar, Indonesia</a>
          <a href="/admin">Admin</a>
          <span className="footer-label footer-social-label">IKUTI KAMI</span>
          <div className="footer-social-links">
            <a href="https://www.instagram.com/lontaraiot/" target="_blank" rel="noreferrer" aria-label="Instagram LontaraIoT">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="social-icon-dot" cx="17.5" cy="6.5" r="1" /></svg>
              Instagram
            </a>
            <a href="https://www.facebook.com/profile.php?id=61596416695058" target="_blank" rel="noreferrer" aria-label="Facebook LontaraIoT">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2-2h1.7V1.4C17 1.2 15.8 1 14.5 1 11.1 1 9 3 9 6.7V9H6v4h3v8z" /></svg>
              Facebook
            </a>
          </div>
        </div>
        <div className="footer-note">
          <span>✳</span>
          <p>Teknologi untuk<br />masa depan yang<br /><strong>berkelanjutan.</strong></p>
        </div>
      </div>
      <div className="footer-bottom" data-reveal="up">
        <span>© {new Date().getFullYear()} LontaraIoT. Belajar, berkarya, bertumbuh.</span>
        <span>DIBUAT DENGAN RASA INGIN TAHU <span className="pulse-dot" /></span>
      </div>
    </footer>
  );
}
