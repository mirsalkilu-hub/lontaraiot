"use client";

import { useEffect, useState } from "react";

const today = new Date().toISOString().slice(0, 10);
const emptyActivity = {
  title: "",
  activity_type: "",
  description: "",
  activity_date: today,
  location: "",
  registration_open: true,
};

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Permintaan gagal diproses.");
  return data;
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function safeFilename(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kegiatan";
}

function compareParticipantOrder(first, second) {
  return Number(first.sort_order ?? 0) - Number(second.sort_order ?? 0) ||
    String(first.created_at || "").localeCompare(String(second.created_at || "")) ||
    first.id.localeCompare(second.id);
}

export default function ActivityManagement({ accessToken }) {
  const [activities, setActivities] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [sessionDates, setSessionDates] = useState({});
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantActivityFilter, setParticipantActivityFilter] = useState("");
  const [participantSort, setParticipantSort] = useState("default");
  const [participantPage, setParticipantPage] = useState(0);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [participantForm, setParticipantForm] = useState(null);
  const [savingParticipant, setSavingParticipant] = useState(false);
  const [movingParticipantId, setMovingParticipantId] = useState("");
  const [form, setForm] = useState(emptyActivity);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingRegistrationId, setUpdatingRegistrationId] = useState("");
  const [message, setMessage] = useState("");
  const headers = { Authorization: `Bearer ${accessToken}` };
  const normalizedParticipantSearch = participantSearch.trim().toLocaleLowerCase("id-ID");
  const registrationsByActivity = new Map();
  registrations.forEach((registration) => {
    const activityRegistrations = registrationsByActivity.get(registration.activity_id) || [];
    activityRegistrations.push(registration);
    registrationsByActivity.set(registration.activity_id, activityRegistrations);
  });
  const participantPositions = new Map();
  registrationsByActivity.forEach((activityRegistrations) => {
    activityRegistrations.sort(compareParticipantOrder).forEach((registration, index) => {
      participantPositions.set(registration.id, { index, total: activityRegistrations.length });
    });
  });
  const orderedRegistrations = [...registrations].sort((first, second) => {
    const firstActivity = activities.find((activity) => activity.id === first.activity_id)?.title || "";
    const secondActivity = activities.find((activity) => activity.id === second.activity_id)?.title || "";
    return firstActivity.localeCompare(secondActivity, "id-ID") || compareParticipantOrder(first, second);
  });
  const filteredRegistrations = orderedRegistrations.filter((registration) => {
    if (participantActivityFilter && registration.activity_id !== participantActivityFilter) return false;
    const activityTitle = activities.find((activity) => activity.id === registration.activity_id)?.title || "";
    return [
      registration.full_name,
      registration.gender,
      registration.email,
      registration.phone,
      registration.organization,
      activityTitle,
    ].some((value) => value?.toLocaleLowerCase("id-ID").includes(normalizedParticipantSearch));
  });
  const sortedRegistrations = [...filteredRegistrations];
  if (participantSort !== "default") {
    const sortByOrganization = participantSort.startsWith("organization");
    const descending = participantSort.endsWith("desc");
    sortedRegistrations.sort((first, second) => {
      const firstValue = sortByOrganization ? first.organization : first.full_name;
      const secondValue = sortByOrganization ? second.organization : second.full_name;
      const comparison = firstValue.localeCompare(secondValue, "id-ID", { sensitivity: "base" });
      return (descending ? -comparison : comparison) || compareParticipantOrder(first, second);
    });
  }
  const participantPageCount = Math.ceil(sortedRegistrations.length / 10);
  const currentParticipantPage = Math.min(participantPage, Math.max(participantPageCount - 1, 0));
  const visibleRegistrations = sortedRegistrations.slice(currentParticipantPage * 10, currentParticipantPage * 10 + 10);

  async function loadData() {
    const [activityData, registrationData, sessionData, attendanceData] = await Promise.all([
      requestJson("/api/activities", { headers }),
      requestJson("/api/registrations", { headers }),
      requestJson("/api/activity-sessions", { headers }),
      requestJson("/api/attendance", { headers }),
    ]);
    setActivities(activityData);
    setRegistrations(registrationData);
    setSessions(sessionData);
    setAttendance(attendanceData);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      requestJson("/api/activities", { headers }),
      requestJson("/api/registrations", { headers }),
      requestJson("/api/activity-sessions", { headers }),
      requestJson("/api/attendance", { headers }),
    ]).then(([activityData, registrationData, sessionData, attendanceData]) => {
      if (active) {
        setActivities(activityData);
        setRegistrations(registrationData);
        setSessions(sessionData);
        setAttendance(attendanceData);
      }
    }).catch((error) => {
      if (active) setMessage(error.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [accessToken]);

  function resetForm() {
    setEditingId("");
    setForm({ ...emptyActivity, activity_date: today });
  }

  async function saveActivity(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const activity = await requestJson("/api/activities", {
        method: editingId ? "PUT" : "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
      });
      setActivities((items) => editingId
        ? items.map((item) => item.id === editingId ? activity : item)
        : [...items, activity].sort((a, b) => a.activity_date.localeCompare(b.activity_date)));
      resetForm();
      setMessage("Kegiatan berhasil disimpan.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeActivity(activity) {
    if (!window.confirm(`Hapus kegiatan "${activity.title}" dan seluruh data pendaftarannya?`)) return;
    setMessage("");
    try {
      await requestJson(`/api/activities?id=${encodeURIComponent(activity.id)}`, { method: "DELETE", headers });
      setActivities((items) => items.filter((item) => item.id !== activity.id));
      setRegistrations((items) => items.filter((item) => item.activity_id !== activity.id));
      setSessions((items) => items.filter((item) => item.activity_id !== activity.id));
      if (editingId === activity.id) resetForm();
      setMessage("Kegiatan dan data pendaftarannya berhasil dihapus.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleRegistration(activity) {
    const registrationOpen = !activity.registration_open;
    setUpdatingRegistrationId(activity.id);
    setMessage("");
    try {
      const updated = await requestJson("/api/activities", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id: activity.id, registration_open: registrationOpen }),
      });
      setActivities((items) => items.map((item) => item.id === updated.id
        ? { ...item, registration_open: updated.registration_open }
        : item));
      setMessage(registrationOpen
        ? `Pendaftaran kegiatan "${activity.title}" berhasil dibuka.`
        : `Pendaftaran kegiatan "${activity.title}" berhasil ditutup.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUpdatingRegistrationId("");
    }
  }

  function startEditingParticipant(participant) {
    setEditingParticipant(participant);
    setParticipantForm({
      full_name: participant.full_name,
      gender: participant.gender || "Belum diisi",
      email: participant.email,
      phone: participant.phone,
      organization: participant.organization,
    });
    setMessage("");
  }

  function cancelEditingParticipant() {
    setEditingParticipant(null);
    setParticipantForm(null);
  }

  async function saveParticipant(event) {
    event.preventDefault();
    setSavingParticipant(true);
    setMessage("");
    try {
      const updated = await requestJson("/api/registrations", {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ ...participantForm, id: editingParticipant.id }),
      });
      setRegistrations((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      cancelEditingParticipant();
      setMessage("Data peserta berhasil diperbarui.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingParticipant(false);
    }
  }

  async function deleteParticipant(participant) {
    const activityTitle = activities.find((activity) => activity.id === participant.activity_id)?.title || "kegiatan ini";
    if (!window.confirm(`Hapus pendaftaran ${participant.full_name} dari "${activityTitle}"? Riwayat absensinya juga akan dihapus.`)) return;
    setMessage("");
    try {
      await requestJson(`/api/registrations?id=${encodeURIComponent(participant.id)}`, { method: "DELETE", headers });
      setRegistrations((items) => items.filter((item) => item.id !== participant.id));
      setAttendance((items) => items.filter((item) => item.registration_id !== participant.id));
      if (editingParticipant?.id === participant.id) cancelEditingParticipant();
      setMessage("Pendaftaran peserta dan riwayat absensinya berhasil dihapus.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function moveParticipant(participant, direction) {
    setMovingParticipantId(participant.id);
    setMessage("");
    try {
      const updatedOrder = await requestJson("/api/registrations", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id: participant.id, direction }),
      });
      const orderById = new Map(updatedOrder.map((item) => [item.id, item.sort_order]));
      setRegistrations((items) => items.map((item) => orderById.has(item.id)
        ? { ...item, sort_order: orderById.get(item.id) }
        : item));
      setMessage("Urutan peserta berhasil diperbarui.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setMovingParticipantId("");
    }
  }

  async function addAttendanceDate(activity) {
    const sessionDate = sessionDates[activity.id];
    if (!sessionDate) {
      setMessage("Pilih tanggal absensi terlebih dahulu.");
      return;
    }
    setMessage("");
    try {
      await requestJson("/api/activity-sessions", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ activity_id: activity.id, session_date: sessionDate }),
      });
      setSessionDates((dates) => ({ ...dates, [activity.id]: "" }));
      await loadData();
      setMessage(`Tanggal absensi ${formatDate(sessionDate)} berhasil ditambahkan.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function removeAttendanceDate(session) {
    if (!window.confirm(`Hapus absensi tanggal ${formatDate(session.session_date)} beserta seluruh catatan kehadirannya?`)) return;
    setMessage("");
    try {
      await requestJson(`/api/activity-sessions?id=${encodeURIComponent(session.id)}`, { method: "DELETE", headers });
      setSessions((items) => items.filter((item) => item.id !== session.id));
      setAttendance((items) => items.filter((item) => item.session_id !== session.id));
      setMessage("Tanggal absensi dan catatannya berhasil dihapus.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleCheckin(session) {
    setMessage("");
    try {
      const updated = await requestJson("/api/activity-sessions", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id: session.id, checkin_open: !session.checkin_open }),
      });
      setSessions((items) => items.map((item) => item.id === updated.id ? { ...item, checkin_open: updated.checkin_open } : item));
      setMessage(updated.checkin_open ? "Tautan check-in dibuka kembali." : "Tautan check-in ditutup.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function shareCheckin(session) {
    const link = `${window.location.origin}/absen/${session.attendance_token}`;
    try {
      if (!navigator.clipboard?.writeText) {
        window.prompt("Salin tautan absensi ini untuk dibagikan:", link);
        return;
      }
      await navigator.clipboard.writeText(link);
      setMessage("Tautan absensi berhasil disalin. Bagikan kepada peserta kegiatan.");
    } catch (error) {
      setMessage(`Tautan tidak dapat disalin otomatis: ${link}`);
    }
  }

  async function updateAttendance(record) {
    setMessage("");
    try {
      const updated = await requestJson("/api/attendance", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, attended: !record.attended }),
      });
      setAttendance((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch (error) {
      setMessage(error.message);
    }
  }

  function downloadCsv(activity, participants, activitySessions, activityAttendance) {
    const columns = [
      "Tanggal absensi",
      "Nama lengkap",
      "Jenis kelamin",
      "Email",
      "Nomor telepon",
      "Sekolah/instansi",
      "Kegiatan",
      "Jenis kegiatan",
      "Lokasi",
      "Status kehadiran",
      "Waktu check-in",
    ];
    const csvCell = (value) => {
      let text = String(value ?? "");
      if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const rows = activitySessions.length
      ? activitySessions.flatMap((session) => participants.map((participant) => {
        const record = activityAttendance.find((item) => item.session_id === session.id && item.registration_id === participant.id);
        return [
          session.session_date,
          participant.full_name,
          participant.gender,
          participant.email,
          participant.phone,
          participant.organization,
          activity.title,
          activity.activity_type,
          activity.location,
          record?.attended ? "Hadir" : "Belum hadir",
          record?.marked_at ? new Date(record.marked_at).toLocaleString("id-ID") : "",
        ];
      }))
      : participants.map((participant) => [
        "Belum ada tanggal absensi",
        participant.full_name,
        participant.gender,
        participant.email,
        participant.phone,
        participant.organization,
        activity.title,
        activity.activity_type,
        activity.location,
        "Belum dijadwalkan",
        "",
      ]);
    const csv = `\uFEFF${[columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-absensi-${safeFilename(activity.title)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadPdf(activity, participants, activitySessions, activityAttendance) {
    setMessage("");
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const titleLines = doc.splitTextToSize(activity.title, pageWidth - 28).slice(0, 2);
      const headerHeight = 40 + (titleLines.length - 1) * 7;
      const navy = [16, 47, 94];
      const orange = [232, 135, 0];
      const paleBlue = [243, 246, 251];
      const orderedSessions = [...activitySessions].sort((a, b) => a.session_date.localeCompare(b.session_date));
      const rows = orderedSessions.length
        ? orderedSessions.flatMap((session) => participants.map((participant, index) => {
          const record = activityAttendance.find((item) => item.session_id === session.id && item.registration_id === participant.id);
          return [
            String(index + 1),
            formatDate(session.session_date),
            participant.full_name,
            participant.gender,
            participant.email,
            participant.phone,
            participant.organization,
            record?.attended ? "HADIR" : "BELUM HADIR",
          ];
        }))
        : participants.map((participant, index) => [
          String(index + 1),
          "Belum dijadwalkan",
          participant.full_name,
          participant.gender,
          participant.email,
          participant.phone,
          participant.organization,
          "BELUM ADA SESI",
        ]);
      const presentCount = activityAttendance.filter((record) =>
        record.attended && orderedSessions.some((session) => session.id === record.session_id),
      ).length;
      const expectedCount = participants.length * orderedSessions.length;

      doc.setFillColor(...navy);
      doc.rect(0, 0, pageWidth, headerHeight, "F");
      doc.setTextColor(198, 220, 247);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("LONTARA IoT & ROBOTICS", 14, 9);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text("REKAPITULASI ABSENSI", pageWidth - 14, 9, { align: "right" });
      doc.setFontSize(16);
      doc.text(titleLines, 14, 19);
      const metadataY = 19 + titleLines.length * 7;
      doc.setTextColor(198, 220, 247);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`${activity.activity_type}  |  ${activity.location}`, 14, metadataY);
      doc.setFillColor(...orange);
      doc.rect(14, headerHeight - 3, 25, 1.5, "F");

      doc.setTextColor(...navy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`PESERTA  ${participants.length}`, 14, headerHeight + 9);
      doc.text(`TANGGAL ABSENSI  ${orderedSessions.length}`, 64, headerHeight + 9);
      doc.text(`KEHADIRAN  ${presentCount} / ${expectedCount}`, 132, headerHeight + 9);
      doc.setTextColor(100, 117, 140);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Dibuat ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`, pageWidth - 14, headerHeight + 9, { align: "right" });

      autoTable(doc, {
        head: [["NO.", "TANGGAL ABSENSI", "NAMA PESERTA", "JENIS KELAMIN", "EMAIL", "TELEPON", "SEKOLAH / INSTANSI", "STATUS"]],
        body: rows,
        startY: headerHeight + 14,
        margin: { top: 17, right: 14, bottom: 14, left: 14 },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 8, cellPadding: 3, textColor: navy, lineColor: [220, 228, 240], lineWidth: 0.15, overflow: "linebreak" },
        headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
        alternateRowStyles: { fillColor: paleBlue },
        columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 28 }, 2: { cellWidth: 40 }, 3: { cellWidth: 25 }, 4: { cellWidth: 48 }, 5: { cellWidth: 28 }, 6: { cellWidth: 54 }, 7: { cellWidth: 28, fontStyle: "bold" } },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            doc.setFillColor(...navy);
            doc.rect(0, 0, pageWidth, 12, "F");
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.text(`LONTARA  /  ${activity.title}`, 14, 8);
          }
          doc.setTextColor(100, 117, 140);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.text("LONTARA IoT & ROBOTICS  ·  Dokumen rekap absensi", 14, pageHeight - 6);
          doc.text(`Halaman ${data.pageNumber}`, pageWidth - 14, pageHeight - 6, { align: "right" });
        },
      });
      doc.save(`rekap-absensi-${safeFilename(activity.title)}.pdf`);
    } catch (error) {
      console.error("Unable to generate attendance PDF:", error);
      setMessage(error.message || "PDF rekap absensi gagal dibuat.");
    }
  }

  return (
    <section className="activity-admin" aria-labelledby="activity-admin-heading">
      <div className="admin-news-list-head">
        <div>
          <span className="admin-panel-kicker">LEARNING ACTIVITIES</span>
          <h2 id="activity-admin-heading">Kegiatan &amp; absensi <span>{activities.length}</span></h2>
        </div>
        <button className="admin-secondary-button" type="button" disabled={loading} onClick={() => {
          setLoading(true);
          loadData().then(() => setMessage("Data kegiatan berhasil dimuat ulang."))
            .catch((error) => setMessage(error.message)).finally(() => setLoading(false));
        }}>{loading ? "Memuat..." : "↻ Muat ulang"}</button>
      </div>

      <form className="admin-form activity-form" onSubmit={saveActivity}>
        <h3>{editingId ? "Edit kegiatan" : "Buat kegiatan baru"}</h3>
        <label>Judul kegiatan
          <input required maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Contoh: Workshop Internet of Things" />
        </label>
        <div className="admin-form-row">
          <label>Jenis kegiatan
            <input required maxLength={80} value={form.activity_type} onChange={(event) => setForm({ ...form, activity_type: event.target.value })} placeholder="Workshop, pelatihan, seminar..." />
          </label>
          <label>Tanggal kegiatan utama
            <input type="date" required value={form.activity_date} onChange={(event) => setForm({ ...form, activity_date: event.target.value })} />
          </label>
        </div>
        <div className="admin-form-row">
          <label>Lokasi
            <input required maxLength={160} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Lokasi kegiatan" />
          </label>
          <label className="activity-open-toggle">
            <input type="checkbox" checked={form.registration_open} onChange={(event) => setForm({ ...form, registration_open: event.target.checked })} />
            Pendaftaran dibuka
          </label>
        </div>
        <label>Deskripsi
          <textarea required maxLength={2000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Informasi singkat tentang kegiatan" />
        </label>
        <div className="admin-form-actions">
          <button className="button button-dark" type="submit" disabled={saving}>{saving ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Buat kegiatan"} <span>↗</span></button>
          {editingId && <button className="admin-secondary-button" type="button" onClick={resetForm}>Batal edit</button>}
        </div>
      </form>

      {message && <p className="activity-admin-message" role="status">{message}</p>}

      <section className="admin-registration-list" aria-labelledby="admin-registration-heading">
        <div className="admin-news-list-head">
          <div>
            <span className="admin-panel-kicker">REGISTERED PARTICIPANTS</span>
            <h3 id="admin-registration-heading">Peserta terdaftar <span>{filteredRegistrations.length} / {registrations.length}</span></h3>
            <p className="admin-registration-help">Gunakan tombol panah untuk mengubah urutan peserta dalam kegiatannya.</p>
          </div>
        </div>
        <div className="admin-registration-filters">
          <label htmlFor="participant-search">Cari peserta
            <input
              id="participant-search"
              type="search"
              value={participantSearch}
              onChange={(event) => {
                setParticipantSearch(event.target.value);
                setParticipantPage(0);
              }}
              placeholder="Nama, email, telepon, sekolah..."
            />
          </label>
          <label htmlFor="participant-activity-filter">Filter kegiatan
            <select
              id="participant-activity-filter"
              value={participantActivityFilter}
              onChange={(event) => {
                setParticipantActivityFilter(event.target.value);
                setParticipantPage(0);
              }}
            >
              <option value="">Semua kegiatan</option>
              {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title}</option>)}
            </select>
          </label>
          <label htmlFor="participant-sort">Urutkan peserta
            <select
              id="participant-sort"
              value={participantSort}
              onChange={(event) => {
                setParticipantSort(event.target.value);
                setParticipantPage(0);
              }}
            >
              <option value="default">Urutan awal</option>
              <option value="name-asc">Nama peserta (A–Z)</option>
              <option value="name-desc">Nama peserta (Z–A)</option>
              <option value="organization-asc">Sekolah/instansi (A–Z)</option>
              <option value="organization-desc">Sekolah/instansi (Z–A)</option>
            </select>
          </label>
        </div>
        {editingParticipant && participantForm && (
          <form className="admin-registration-edit-form" onSubmit={saveParticipant}>
            <div className="admin-registration-edit-head">
              <div>
                <span className="admin-panel-kicker">EDIT PARTICIPANT</span>
                <h4>Edit data peserta</h4>
                <p>Kegiatan peserta tidak berubah agar riwayat absensinya tetap terhubung.</p>
              </div>
              <button className="admin-text-button" type="button" onClick={cancelEditingParticipant}>Batal</button>
            </div>
            <div className="admin-registration-edit-fields">
              <label>Nama lengkap
                <input required maxLength={120} value={participantForm.full_name} onChange={(event) => setParticipantForm({ ...participantForm, full_name: event.target.value })} />
              </label>
              <label>Jenis kelamin
                <select required value={participantForm.gender} onChange={(event) => setParticipantForm({ ...participantForm, gender: event.target.value })}>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                  <option value="Memilih tidak menjawab">Memilih tidak menjawab</option>
                  {participantForm.gender === "Belum diisi" && <option value="Belum diisi">Belum diisi</option>}
                </select>
              </label>
              <label>Email
                <input required type="email" maxLength={254} value={participantForm.email} onChange={(event) => setParticipantForm({ ...participantForm, email: event.target.value })} />
              </label>
              <label>Nomor telepon
                <input required type="tel" maxLength={40} pattern=".*[0-9].*" value={participantForm.phone} onChange={(event) => setParticipantForm({ ...participantForm, phone: event.target.value })} />
              </label>
              <label>Sekolah / instansi
                <input required maxLength={160} value={participantForm.organization} onChange={(event) => setParticipantForm({ ...participantForm, organization: event.target.value })} />
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="button button-dark" type="submit" disabled={savingParticipant}>{savingParticipant ? "Menyimpan..." : "Simpan data"} <span>↗</span></button>
              <button className="admin-secondary-button" type="button" onClick={cancelEditingParticipant} disabled={savingParticipant}>Batal</button>
            </div>
          </form>
        )}
        {loading ? <p className="admin-status">Memuat daftar peserta...</p> : filteredRegistrations.length ? (
          <div className="admin-registration-table-wrap">
            <table className="admin-registration-table">
              <thead>
                <tr>
                  <th>Peserta</th>
                  <th>Kegiatan</th>
                  <th>Kontak</th>
                  <th>Sekolah / instansi</th>
                  <th>Waktu daftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleRegistrations.map((registration) => {
                  const activity = activities.find((item) => item.id === registration.activity_id);
                  const position = participantPositions.get(registration.id);
                  return (
                    <tr key={registration.id}>
                      <td><strong>{registration.full_name}</strong><span>{registration.gender || "Belum diisi"}</span></td>
                      <td>{activity?.title || registration.activities?.title || "Kegiatan dihapus"}</td>
                      <td><span>{registration.email}</span><span>{registration.phone}</span></td>
                      <td>{registration.organization}</td>
                      <td>{registration.created_at ? new Date(registration.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—"}</td>
                      <td>
                        <div className="admin-participant-actions">
                          <button className="admin-secondary-button" type="button" aria-label={`Naikkan urutan ${registration.full_name}`} title="Naikkan urutan" disabled={!position || position.index === 0 || movingParticipantId !== ""} onClick={() => moveParticipant(registration, "up")}>↑</button>
                          <button className="admin-secondary-button" type="button" aria-label={`Turunkan urutan ${registration.full_name}`} title="Turunkan urutan" disabled={!position || position.index === position.total - 1 || movingParticipantId !== ""} onClick={() => moveParticipant(registration, "down")}>↓</button>
                          <button className="admin-secondary-button" type="button" onClick={() => startEditingParticipant(registration)}>Edit</button>
                          <button className="admin-secondary-button admin-delete-button" type="button" onClick={() => deleteParticipant(registration)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="admin-registration-empty" role="status">
          {registrations.length ? "Tidak ada peserta yang cocok dengan pencarian atau filter." : "Belum ada peserta yang mendaftar."}
        </p>}
        {!loading && sortedRegistrations.length > 0 && (
          <div className="admin-registration-pagination">
            <span>Menampilkan {currentParticipantPage * 10 + 1}–{Math.min((currentParticipantPage + 1) * 10, sortedRegistrations.length)} dari {sortedRegistrations.length} peserta</span>
            <div>
              <button
                className="admin-secondary-button"
                type="button"
                disabled={currentParticipantPage === 0}
                onClick={() => setParticipantPage(currentParticipantPage - 1)}
              >Sebelumnya</button>
              <span>Halaman {currentParticipantPage + 1} dari {participantPageCount}</span>
              <button
                className="admin-secondary-button"
                type="button"
                disabled={currentParticipantPage >= participantPageCount - 1}
                onClick={() => setParticipantPage(currentParticipantPage + 1)}
              >Berikutnya</button>
            </div>
          </div>
        )}
      </section>

      <div className="activity-admin-list">
        {loading ? <p className="admin-status">Memuat kegiatan dan peserta...</p> : activities.length === 0 ? (
          <p className="admin-status">Belum ada kegiatan. Buat kegiatan pertama melalui formulir di atas.</p>
        ) : activities.map((activity) => {
          const participants = registrations.filter((item) => item.activity_id === activity.id);
          const activitySessions = sessions.filter((item) => item.activity_id === activity.id)
            .sort((a, b) => a.session_date.localeCompare(b.session_date));
          const activityAttendance = attendance.filter((item) =>
            activitySessions.some((session) => session.id === item.session_id),
          );
          const presentCount = activityAttendance.filter((item) => item.attended).length;
          return (
            <article className="activity-admin-card" key={activity.id}>
              <div className="activity-admin-card-head">
                <div>
                  <span>{activity.activity_type} · Kegiatan utama {formatDate(activity.activity_date)} · {activity.location}</span>
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>
                  <span className={activity.registration_open ? "activity-status is-open" : "activity-status"}>{activity.registration_open ? "Pendaftaran dibuka" : "Pendaftaran ditutup"} · {participants.length} peserta · {activitySessions.length} tanggal absensi · {presentCount} check-in</span>
                </div>
                <div className="admin-news-actions activity-actions">
                  <button className="admin-secondary-button" type="button" onClick={() => downloadCsv(activity, participants, activitySessions, activityAttendance)}>Unduh CSV</button>
                  <button className="admin-secondary-button" type="button" onClick={() => downloadPdf(activity, participants, activitySessions, activityAttendance)}>Unduh PDF</button>
                  <button
                    className="admin-secondary-button"
                    type="button"
                    disabled={updatingRegistrationId !== ""}
                    onClick={() => toggleRegistration(activity)}
                  >
                    {updatingRegistrationId === activity.id
                      ? activity.registration_open ? "Menutup..." : "Membuka..."
                      : activity.registration_open ? "Tutup pendaftaran" : "Buka pendaftaran"}
                  </button>
                  <button className="admin-secondary-button" type="button" onClick={() => {
                    setEditingId(activity.id);
                    setForm({
                      title: activity.title,
                      activity_type: activity.activity_type,
                      description: activity.description,
                      activity_date: activity.activity_date,
                      location: activity.location,
                      registration_open: activity.registration_open,
                    });
                    setMessage("");
                  }}>Edit</button>
                  <button className="admin-secondary-button admin-delete-button" type="button" onClick={() => removeActivity(activity)}>Hapus</button>
                </div>
              </div>

              <div className="activity-session-manager">
                <div className="activity-session-manager-head">
                  <div>
                    <h4>Tanggal absensi</h4>
                    <p>Pendaftaran tetap satu kali; tambahkan satu tanggal untuk setiap hari check-in.</p>
                  </div>
                  <div className="activity-date-add">
                    <input
                      aria-label={`Tanggal absensi baru untuk ${activity.title}`}
                      type="date"
                      value={sessionDates[activity.id] || ""}
                      onChange={(event) => setSessionDates((dates) => ({ ...dates, [activity.id]: event.target.value }))}
                    />
                    <button className="admin-secondary-button" type="button" onClick={() => addAttendanceDate(activity)}>Tambah tanggal</button>
                  </div>
                </div>

                {activitySessions.length === 0 ? <p className="activity-no-sessions">Belum ada tanggal absensi. Tambahkan tanggal untuk membuat tautan check-in.</p> : (
                  <div className="activity-session-list">
                    {activitySessions.map((session) => {
                      const sessionRecords = activityAttendance.filter((item) => item.session_id === session.id);
                      const sessionPresent = sessionRecords.filter((item) => item.attended).length;
                      return (
                        <section className="activity-session-card" key={session.id}>
                          <div className="activity-session-head">
                            <div>
                              <strong>{formatDate(session.session_date)}</strong>
                              <span>{sessionPresent} dari {participants.length} hadir</span>
                            </div>
                            <div className="activity-session-actions">
                              <button className="admin-secondary-button" type="button" onClick={() => shareCheckin(session)}>Salin link absen</button>
                              <button className="admin-secondary-button" type="button" onClick={() => toggleCheckin(session)}>{session.checkin_open ? "Tutup check-in" : "Buka check-in"}</button>
                              <button className="admin-secondary-button admin-delete-button" type="button" onClick={() => removeAttendanceDate(session)}>Hapus tanggal</button>
                            </div>
                          </div>
                          <p className={session.checkin_open ? "session-link-status is-open" : "session-link-status"}>
                            {session.checkin_open ? "Tautan check-in aktif" : "Check-in ditutup"}
                          </p>
                          {participants.length > 0 ? (
                            <div className="activity-participant-list">
                              {participants.map((participant) => {
                                const record = sessionRecords.find((item) => item.registration_id === participant.id);
                                return (
                                  <div className="activity-participant" key={participant.id}>
                                    <div><strong>{participant.full_name}</strong><span>{participant.gender} · {participant.email} · {participant.phone} · {participant.organization}</span></div>
                                    {record ? (
                                      <button className={record.attended ? "attendance-button is-present" : "attendance-button"} type="button" onClick={() => updateAttendance(record)}>
                                        {record.attended ? "✓ Hadir · Batalkan" : "Tandai hadir"}
                                      </button>
                                    ) : <span className="activity-record-missing">Data absensi belum tersedia</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : <p className="activity-no-sessions">Belum ada peserta terdaftar pada kegiatan ini.</p>}
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
