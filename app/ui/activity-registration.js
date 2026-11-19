"use client";

import { useEffect, useState } from "react";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";

const emptyForm = { activity_id: "", full_name: "", gender: "", email: "", phone: "", organization: "" };

export default function ActivityRegistration() {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/api/activities").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Kegiatan tidak dapat dimuat.");
      if (active) {
        setActivities(data);
        setForm((current) => ({ ...current, activity_id: current.activity_id || data[0]?.id || "" }));
      }
    }).catch((error) => {
      if (active) setMessage({ text: error.message, error: true });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function submitRegistration(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Pendaftaran gagal.");
      setMessage({ text: "Pendaftaran berhasil dicatat. Hubungi admin kegiatan jika Anda memerlukan konfirmasi.", error: false });
      setForm((current) => ({ ...emptyForm, activity_id: current.activity_id }));
    } catch (error) {
      setMessage({ text: error.message, error: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="registration-page">
      <SiteHeader />
      <section className="registration-content">
        <div className="registration-intro">
          <p className="eyebrow"><span className="eyebrow-line" /> BELAJAR BERSAMA LONTARA</p>
          <h1>Pilih kegiatan,<br /><span>mulai berkarya.</span></h1>
          <p>Temukan kegiatan belajar teknologi yang sesuai untukmu. Isi formulir pendaftaran dan kami akan mencatat keikutsertaanmu.</p>
          <a className="text-link" href="/">Kembali ke beranda <span>↗</span></a>
        </div>
        <form className="registration-form" onSubmit={submitRegistration}>
          <span className="admin-panel-kicker">FORMULIR PESERTA</span>
          <h2>Daftar kegiatan</h2>
          <p>Pilih salah satu kegiatan yang masih membuka pendaftaran.</p>
          {loading ? <p className="registration-empty" role="status">Memuat daftar kegiatan...</p> : activities.length ? (
            <>
              <label>Pilih kegiatan
                <select required value={form.activity_id} onChange={(event) => setForm({ ...form, activity_id: event.target.value })}>
                  {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title} — {activity.activity_type} · {new Date(`${activity.activity_date}T00:00:00`).toLocaleDateString("id-ID")}</option>)}
                </select>
              </label>
              {form.activity_id && (() => {
                const activity = activities.find((item) => item.id === form.activity_id);
                return activity ? <div className="registration-activity-info"><strong>{activity.title}</strong><span>{activity.location} · {new Date(`${activity.activity_date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span><p>{activity.description}</p></div> : null;
              })()}
              <label>Nama lengkap
                <input required maxLength={120} autoComplete="name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
              </label>
              <label>Jenis kelamin
                <select required value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
                  <option value="">Pilih jenis kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                  <option value="Memilih tidak menjawab">Memilih tidak menjawab</option>
                </select>
              </label>
              <label>Email
                <input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>Nomor telepon
                <input required type="tel" maxLength={40} autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
              <label>Asal sekolah / instansi
                <input required maxLength={160} autoComplete="organization" value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} />
              </label>
              <button className="button button-dark" type="submit" disabled={submitting}>{submitting ? "Mengirim pendaftaran..." : "Kirim pendaftaran"} <span>↗</span></button>
            </>
          ) : !message?.error ? <p className="registration-empty" role="status">Belum ada kegiatan yang membuka pendaftaran. Silakan kunjungi kembali nanti.</p> : null}
          {message && <p className={message.error ? "registration-message is-error" : "registration-message"} role={message.error ? "alert" : "status"}>{message.text}</p>}
        </form>
      </section>
      <SiteFooter />
    </main>
  );
}
