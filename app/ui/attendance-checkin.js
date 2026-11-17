"use client";

import { useEffect, useState } from "react";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AttendanceCheckin({ token }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/attendance?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Tautan absensi tidak dapat dibuka.");
        if (active) setSession(data);
      })
      .catch((error) => {
        if (active) setMessage({ text: error.message, error: true });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  async function checkIn(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Check-in gagal diproses.");
      setMessage({ text: "Absensi berhasil dicatat. Terima kasih sudah hadir!", error: false });
    } catch (error) {
      setMessage({ text: error.message, error: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="registration-page">
      <SiteHeader />
      <section className="checkin-content">
        <div className="checkin-brand-mark" aria-hidden="true">L</div>
        <p className="eyebrow"><span className="eyebrow-line" /> LONTARA IoT &amp; ROBOTICS</p>
        <h1>Absensi <span>kegiatan.</span></h1>
        {loading ? <p className="registration-empty" role="status">Memeriksa tautan absensi...</p> : session ? (
          <>
            <div className="checkin-session-card">
              <span>{session.activity_type} · {formatDate(session.session_date)}</span>
              <h2>{session.activity_title}</h2>
              <p>{session.location}</p>
            </div>
            <form className="registration-form checkin-form" onSubmit={checkIn}>
              <span className="admin-panel-kicker">CHECK-IN PESERTA</span>
              <h2>Konfirmasi kehadiran</h2>
              <p>Gunakan email dan nomor telepon yang sama dengan data pendaftaran.</p>
              <label>Email pendaftaran
                <input required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>Nomor telepon pendaftaran
                <input required type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <button className="button button-dark" type="submit" disabled={submitting}>
                {submitting ? "Mencatat kehadiran..." : "Saya hadir"} <span>↗</span>
              </button>
              {message && <p className={message.error ? "registration-message is-error" : "registration-message"} role={message.error ? "alert" : "status"}>{message.text}</p>}
            </form>
          </>
        ) : <p className="registration-message is-error" role="alert">{message?.text || "Tautan absensi tidak tersedia."}</p>}
      </section>
      <SiteFooter />
    </main>
  );
}
