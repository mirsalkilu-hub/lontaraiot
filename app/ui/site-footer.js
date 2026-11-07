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
