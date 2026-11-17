import AttendanceCheckin from "../../ui/attendance-checkin";

export const metadata = {
  title: "Absensi Kegiatan | LontaraIoT",
  robots: { index: false, follow: false },
};

export default async function AttendancePage({ params }) {
  const { token } = await params;
  return <AttendanceCheckin token={token} />;
}
