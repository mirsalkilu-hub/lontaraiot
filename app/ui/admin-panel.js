"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { isSupabaseConfigured } from "../../lib/supabase/config";

const blankNews = { title: "", category: "Program", excerpt: "", content: "", date: new Date().toISOString().slice(0, 10) };

export default function AdminPanel() {
  const [news, setNews] = useState([]);
  const [form, setForm] = useState(blankNews);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!imagePreview) return undefined;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  async function loadNews() {
    const response = await fetch("/api/news");
    if (!response.ok) throw new Error("Berita tidak dapat dimuat.");
    setNews(await response.json());
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("Supabase belum dikonfigurasi. Isi URL dan anon key di .env.local.");
      setLoading(false);
      return undefined;
    }

    const supabase = getSupabaseBrowserClient();
    let active = true;
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError) throw sessionError;
      const session = data.session;
      if (!session) return;
      if (session.user.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        if (active) setError("Akun ini belum diberi akses admin di Supabase.");
        return;
      }
      const response = await fetch("/api/admin/session", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Sesi admin tidak valid.");
      }
      if (!active) return;
      setAccessToken(session.access_token);
      setAuthenticated(true);
      await loadNews();
    }).catch((cause) => {
      if (active) setError(cause.message || "Sesi admin tidak dapat diperiksa.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAccessToken(session?.user.app_metadata?.role === "admin" ? session.access_token : "");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(event) {
    event.preventDefault();
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      if (data.user.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Akun ini belum diberi akses admin di Supabase.");
      }
      setAccessToken(data.session.access_token);
      setAuthenticated(true);
      setEmail("");
      setPassword("");
      await loadNews();
    } catch (cause) {
      setError(cause.message || "Login gagal. Periksa email dan kata sandi.");
    }
  }

  async function addNews(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (imageFile) formData.append("image", imageFile);
      const response = await fetch("/api/news", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: formData });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Berita gagal disimpan.");
        return;
      }
      setNews(data);
      setForm({ ...blankNews, date: new Date().toISOString().slice(0, 10) });
      setImageFile(null);
      setImagePreview("");
      setMessage("Berita berhasil diterbitkan dan tampil di halaman utama.");
    } catch {
      setError("Berita gagal disimpan. Periksa koneksi lalu coba kembali.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNews(id) {
    setError("");
    try {
      const response = await fetch(`/api/news?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Berita gagal dihapus.");
        return;
      }
      setNews(data);
      setMessage("Berita berhasil dihapus.");
    } catch {
      setError("Berita gagal dihapus. Periksa koneksi lalu coba kembali.");
    }
  }

  async function logout() {
    const { error: logoutError } = await getSupabaseBrowserClient().auth.signOut();
    if (logoutError) { setError(logoutError.message); return; }
    setAccessToken("");
    setAuthenticated(false);
    setNews([]);
  }

  return (
    <main className="admin-page">
      <header className="admin-header"><a className="brand" href="/" aria-label="LontaraIoT beranda"><img className="brand-logo" src="/lontara-logo.png" alt="Lontara IoT & Robotics Bootcamp" /></a><a href="/" className="admin-back">← Kembali ke website</a></header>
      <section className="admin-content">
        <p className="eyebrow"><span className="eyebrow-line" /> RUANG PENGELOLA</p><h1>Dashboard <span>berita.</span></h1><p className="admin-lead">Kelola cerita dan kabar terbaru yang tampil di halaman utama LontaraIoT.</p>
        {loading ? <p className="admin-status">Memeriksa sesi admin...</p> : !authenticated ? (
          <form className="admin-login" onSubmit={login}><h2>Masuk sebagai admin</h2><p>Gunakan akun admin Supabase untuk melanjutkan.</p><label htmlFor="admin-email">Email<input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label htmlFor="admin-password">Kata sandi<input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button-dark" type="submit">Masuk <span>↗</span></button></form>
        ) : (
          <div className="admin-workspace">
            <div className="admin-workspace-head"><h2>Tulis kabar baru</h2><button className="logout-button" onClick={logout}>Keluar ↗</button></div>
            <form className="admin-form" onSubmit={addNews}>
              <label>Judul<input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <div className="admin-form-row"><label>Kategori<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Program</option><option>Kegiatan</option><option>Inspirasi</option><option>Pengumuman</option></select></label><label>Tanggal<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label></div>
              <label>Ringkasan<textarea required maxLength={220} rows={4} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></label>
              <label>Isi berita<textarea required maxLength={50000} rows={12} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
              <label>Gambar berita <span className="image-help">Opsional · JPEG, PNG, atau WebP · Maksimal 5 MB</span><input className="image-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] || null; setImageFile(file); setImagePreview(file ? URL.createObjectURL(file) : ""); }} /></label>
              {imagePreview && <div className="image-preview-wrap"><img className="image-preview" src={imagePreview} alt="Pratinjau gambar berita" /><button className="logout-button" type="button" onClick={() => { setImageFile(null); setImagePreview(""); }}>Hapus gambar</button></div>}
              <button className="button button-dark" type="submit" disabled={saving}>{saving ? "Menerbitkan..." : "Terbitkan berita"} <span>↗</span></button>
            </form>
            <div className="admin-news-list"><h2>Berita terbit ({news.length})</h2>{news.map((item) => <article className="admin-news-item" key={item.id}>{item.imageUrl && <img className="admin-news-thumb" src={item.imageUrl} alt="" />}<div><span>{item.category} · {item.date}</span><h3>{item.title}</h3></div><button onClick={() => deleteNews(item.id)} aria-label={`Hapus ${item.title}`}>Hapus</button></article>)}</div>
          </div>
        )}
        {error && <p className="admin-alert" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
      </section>
      <footer className="admin-footer">LontaraIoT · Admin portal <span><span className="pulse-dot" /> SECURE SESSION</span></footer>
    </main>
  );
}
