import "./globals.css";

export const metadata = {
  title: "LontaraIoT | Belajar Teknologi, Mencipta Masa Depan",
  description:
    "Lontara IoT & Robotic Bootcamps — ruang belajar teknologi, IoT, dan robotika yang berakar pada kearifan dan bergerak dengan inovasi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
