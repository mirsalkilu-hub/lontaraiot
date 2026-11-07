"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { isSupabaseConfigured } from "../../lib/supabase/config";

const blankNews = {
  title: "",
  category: "Program",
  excerpt: "",
  content: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function AdminPanel() {
  const [news, setNews] = useState([]);
  const [form, setForm] = useState(blankNews);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const notificationId = useRef(0);

  function notify(message, type = "success") {
    notificationId.current += 1;
    setNotification({ id: notificationId.current, message, type });
  }

  useEffect(() => {
    if (!imagePreview) return undefined;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    if (!notification || notification.type === "error") return undefined;
    const timer = setTimeout(() => setNotification(null), 4500);
    return () => clearTimeout(timer);
  }, [notification]);

  async function loadNews() {
    const response = await fetch("/api/news");
    if (!response.ok) throw new Error("Berita tidak dapat dimuat.");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Respons daftar berita tidak valid.");
    setNews(data);
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      notify("Supabase belum dikonfigurasi. Isi URL dan anon key di .env.local.", "error");
      setLoading(false);
      return undefined;
    }

    const supabase = getSupabaseBrowserClient();
    let active = true;
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError) throw sessionError;
      const session = data.session;
      if (!session) {
        notify("Sesi admin belum aktif. Silakan masuk untuk mengelola berita.", "info");
        return;
      }
      if (session.user.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        if (active) notify("Akun ini belum diberi akses admin di Supabase.", "error");
        return;
      }
      const response = await fetch("/api/admin/session", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Sesi admin tidak valid.");
      }
      if (!active) return;
      setAccessToken(session.access_token);
      setAuthenticated(true);
      await loadNews();
      notify("Sesi admin aktif. Berita siap dikelola.", "success");
    }).catch((cause) => {
      if (active) notify(cause.message || "Sesi admin tidak dapat diperiksa.", "error");
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
    setLoggingIn(true);
    notify("Memverifikasi akun admin...", "info");
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
      notify("Login berhasil. Dashboard siap digunakan.");
    } catch (cause) {
      notify(cause.message || "Login gagal. Periksa email dan kata sandi.", "error");
    } finally {
      setLoggingIn(false);
    }
  }

  function resetEditor() {
    setEditingId(null);
    setForm({ ...blankNews, date: new Date().toISOString().slice(0, 10) });
    setImageFile(null);
    setImagePreview("");
    setRemoveExistingImage(false);
    setImageInputKey((key) => key + 1);
  }

  function editNews(item) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      excerpt: item.excerpt,
      content: item.content,
      date: item.date,
    });
    setImageFile(null);
    setImagePreview("");
    setRemoveExistingImage(false);
    setImageInputKey((key) => key + 1);
    notify(`Mode edit dibuka: ${item.title}.`, "info");
  }

  async function saveNews(event) {
    event.preventDefault();
    const wasEditing = Boolean(editingId);
    setSaving(true);
    notify(wasEditing ? "Menyimpan perubahan berita..." : "Menerbitkan berita...", "info");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (wasEditing) {
        formData.append("id", editingId);
        formData.append("removeImage", String(removeExistingImage));
      }
      if (imageFile) formData.append("image", imageFile);
      const response = await fetch("/api/news", {
        method: wasEditing ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Berita gagal disimpan.");
      if (!Array.isArray(data)) throw new Error("Berita tersimpan, tetapi respons daftar tidak valid. Muat ulang halaman.");
      setNews(data);
      resetEditor();
      notify(wasEditing ? "Perubahan berita berhasil disimpan." : "Berita berhasil diterbitkan.");
    } catch (cause) {
      notify(cause.message || "Berita gagal disimpan. Periksa koneksi lalu coba kembali.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function refreshNews() {
    setRefreshing(true);
    notify("Memuat ulang daftar berita...", "info");
    try {
      await loadNews();
      notify("Daftar berita berhasil diperbarui.");
    } catch (cause) {
      notify(cause.message || "Daftar berita gagal dimuat.", "error");
    } finally {
      setRefreshing(false);
    }
  }

  async function deleteNews(id) {
    const item = news.find((post) => post.id === id);
    if (!window.confirm(`Hapus berita "${item?.title || "ini"}"? Tindakan ini tidak dapat dibatalkan.`)) {
      notify("Penghapusan berita dibatalkan.", "info");
      return;
    }
    setDeletingId(id);
    notify("Menghapus berita...", "info");
    try {
      const response = await fetch(`/api/news?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Berita gagal dihapus.");
      if (!Array.isArray(data)) throw new Error("Berita dihapus, tetapi daftar gagal dimuat. Muat ulang halaman.");
      setNews(data);
      if (editingId === id) resetEditor();
      notify("Berita berhasil dihapus.");
    } catch (cause) {
      notify(cause.message || "Berita gagal dihapus. Periksa koneksi lalu coba kembali.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function logout() {
    setLoggingOut(true);
    notify("Mengakhiri sesi admin...", "info");
    try {
      const { error: logoutError } = await getSupabaseBrowserClient().auth.signOut();
      if (logoutError) throw logoutError;
      setAccessToken("");
      setAuthenticated(false);
      setNews([]);
      resetEditor();
      notify("Anda berhasil keluar dari dashboard.");
    } catch (cause) {
      notify(cause.message || "Sesi admin gagal diakhiri.", "error");
    } finally {
      setLoggingOut(false);
    }
  }

  const busy = saving || deletingId !== null || refreshing;
  const editingItem = news.find((item) => item.id === editingId);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="brand" href="/" aria-label="LontaraIoT beranda">
          <img className="brand-logo" src="/lontara-logo.png" alt="Lontara IoT & Robotics Bootcamp" />
        </a>
        <a href="/" className="admin-back">← Kembali ke website</a>
      </header>

      <section className="admin-content">
        <div className="admin-page-heading">
          <p className="eyebrow"><span className="eyebrow-line" /> RUANG PENGELOLA</p>
          <h1>Dashboard <span>berita.</span></h1>
          <p className="admin-lead">Kelola cerita dan kabar terbaru yang tampil di halaman utama LontaraIoT.</p>
        </div>

        {loading ? (
          <p className="admin-status" role="status">Memeriksa sesi admin...</p>
        ) : !authenticated ? (
          <form className="admin-login" onSubmit={login}>
            <div className="admin-panel-kicker">ADMIN ACCESS</div>
            <h2>Selamat datang kembali</h2>
            <p>Masuk dengan akun admin untuk mengelola publikasi.</p>
            <label htmlFor="admin-email">Email
              <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label htmlFor="admin-password">Kata sandi
              <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button className="button button-dark" type="submit" disabled={loggingIn}>
              {loggingIn ? "Memverifikasi..." : "Masuk ke dashboard"} <span>↗</span>
            </button>
            <div className="admin-login-note"><span className="pulse-dot" /> Koneksi terenkripsi dan terlindungi</div>
          </form>
        ) : (
          <div className="admin-workspace">
            <div className="admin-workspace-head">
              <div>
                <span className="admin-panel-kicker">CONTENT MANAGEMENT</span>
                <h2>{editingId ? "Perbarui berita" : "Tulis kabar baru"}</h2>
                <p>{editingId ? "Perubahan akan langsung tampil di halaman berita." : "Bagikan perkembangan terbaru dari LontaraIoT."}</p>
              </div>
              <div className="admin-dashboard-actions">
                <span className="admin-session-badge"><span className="pulse-dot" /> Sesi aman</span>
                <button className="logout-button" type="button" onClick={logout} disabled={loggingOut || busy}>
                  {loggingOut ? "Keluar..." : "Keluar ↗"}
                </button>
              </div>
            </div>

            <form className="admin-form" onSubmit={saveNews}>
              <label>Judul berita
                <input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Tulis judul yang jelas dan menarik" />
              </label>
              <div className="admin-form-row">
                <label>Kategori
                  <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    <option>Program</option><option>Kegiatan</option><option>Inspirasi</option><option>Pengumuman</option>
                  </select>
                </label>
                <label>Tanggal publikasi
                  <input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                </label>
              </div>
              <label><span className="admin-label-row"><span>Ringkasan</span><span className="image-help">{form.excerpt.length}/220 karakter</span></span>
                <textarea required maxLength={220} rows={4} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} placeholder="Ringkas isi berita dalam beberapa kalimat" />
              </label>
              <label><span className="admin-label-row"><span>Isi berita</span><span className="image-help">{form.content.length}/50.000 karakter</span></span>
                <textarea required maxLength={50000} rows={12} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Ceritakan informasi secara lengkap..." />
              </label>
              <label><span className="admin-label-row"><span>Gambar berita</span><span className="image-help">Opsional · JPEG, PNG, atau WebP · Maksimal 5 MB</span></span>
                <input
                  key={imageInputKey}
                  className="image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setImageFile(file);
                    setImagePreview(file ? URL.createObjectURL(file) : "");
                    if (file) setRemoveExistingImage(false);
                  }}
                />
              </label>
              {(imagePreview || (editingItem?.imageUrl && !removeExistingImage)) && (
                <div className="image-preview-wrap">
                  <img className="image-preview" src={imagePreview || editingItem.imageUrl} alt="Pratinjau gambar berita" />
                  <button className="admin-text-button admin-danger-text" type="button" onClick={() => {
                    if (imageFile) {
                      setImageFile(null);
                      setImagePreview("");
                      setImageInputKey((key) => key + 1);
                      notify("Gambar baru dibatalkan.", "info");
                    } else {
                      setRemoveExistingImage(true);
                      notify("Gambar lama akan dihapus saat berita disimpan.", "info");
                    }
                  }}>Hapus gambar</button>
                </div>
              )}
              {removeExistingImage && (
                <p className="admin-image-removed">
                  Gambar saat ini akan dihapus saat perubahan disimpan.
                  <button className="admin-text-button" type="button" onClick={() => {
                    setRemoveExistingImage(false);
                    notify("Penghapusan gambar dibatalkan.", "info");
                  }}>Batalkan</button>
                </p>
              )}
              <div className="admin-form-actions">
                <button className="button button-dark" type="submit" disabled={busy}>
                  {saving ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Terbitkan berita"} <span>↗</span>
                </button>
                {editingId && <button className="admin-secondary-button" type="button" disabled={busy} onClick={() => {
                  resetEditor();
                  notify("Perubahan dibatalkan.", "info");
                }}>Batal edit</button>}
              </div>
            </form>

            <section className="admin-news-list" aria-labelledby="admin-news-heading">
              <div className="admin-news-list-head">
                <div>
                  <span className="admin-panel-kicker">PUBLISHED CONTENT</span>
                  <h2 id="admin-news-heading">Berita terbit <span>{news.length}</span></h2>
                </div>
                <button className="admin-secondary-button" type="button" onClick={refreshNews} disabled={busy}>
                  {refreshing ? "Memuat..." : "↻ Muat ulang"}
                </button>
              </div>
              {news.length ? (
                <div className="admin-news-items">
                  {news.map((item) => (
                    <article className="admin-news-item" key={item.id}>
                      {item.imageUrl
                        ? <img className="admin-news-thumb" src={item.imageUrl} alt="" />
                        : <div className="admin-news-thumb admin-news-placeholder" aria-hidden="true">L</div>}
                      <div className="admin-news-copy">
                        <span>{item.category} <span className="admin-meta-dot">·</span> {item.date}</span>
                        <h3>{item.title}</h3>
                        <p>{item.excerpt}</p>
                      </div>
                      <div className="admin-news-actions">
                        <button className="admin-secondary-button" type="button" disabled={busy} onClick={() => editNews(item)}>Edit</button>
                        <button className="admin-secondary-button admin-delete-button" type="button" disabled={busy || deletingId === item.id} onClick={() => deleteNews(item.id)}>
                          {deletingId === item.id ? "Menghapus..." : "Hapus"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-empty-news">
                  <span className="admin-empty-icon">✳</span>
                  <h3>Belum ada berita</h3>
                  <p>Berita yang diterbitkan akan muncul di daftar ini.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </section>

      <footer className="admin-footer">
        <span>LontaraIoT · Admin portal</span>
        <span><span className="pulse-dot" /> SECURE SESSION</span>
      </footer>
      {notification && (
        <div className={`admin-toast admin-toast-${notification.type}`} key={notification.id} role={notification.type === "error" ? "alert" : "status"} aria-live={notification.type === "error" ? "assertive" : "polite"}>
          <span className="admin-toast-icon" aria-hidden="true">{notification.type === "error" ? "!" : notification.type === "info" ? "i" : "✓"}</span>
          <p>{notification.message}</p>
          <button type="button" aria-label="Tutup notifikasi" onClick={() => setNotification(null)}>×</button>
        </div>
      )}
    </main>
  );
}
