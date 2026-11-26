## LontaraIoT

Website Lontara IoT & Robotic Bootcamps menggunakan Supabase untuk data berita, kegiatan, pendaftaran peserta, absensi, autentikasi admin, dan penyimpanan gambar. Setiap berita memiliki halaman detail di `/berita/[slug]`.

### Persiapan Supabase

1. Buat proyek Supabase.
2. Jalankan `supabase/schema.sql` melalui SQL Editor untuk membuat tabel, indeks, bucket gambar publik, dan kebijakan Row Level Security. Skrip aman dijalankan ulang dan menambahkan kolom yang diperlukan jika tabel lama belum memilikinya. Jalankan ulang skrip ini setelah pembaruan skema agar kebijakan database ikut diperbarui. Berita lama tetap dipertahankan; pendaftaran peserta tetap satu kali per kegiatan, sementara `activity_sessions` dan `attendance_records` menyimpan tanggal serta status absensi per sesi. Status absensi lama dipindahkan ke tanggal kegiatan utama dan urutan awal peserta disusun berdasarkan waktu pendaftaran.
3. Buat akun pengguna melalui **Authentication → Users**. Matikan pendaftaran publik di pengaturan **Authentication → Sign In / Providers**.
4. Salin `.env.example` menjadi `.env.local`, lalu isi URL proyek dan publishable/anon key dari **Project Settings → API Keys**. Untuk memberikan peran admin, ikuti bagian [Menambahkan admin](#menambahkan-admin).

### Menjalankan lokal

1. Pasang dependensi dengan `npm install`.
2. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.
3. Buka `http://localhost:3000/admin`, lalu masuk menggunakan email dan kata sandi akun admin Supabase. Dashboard memisahkan pengelolaan berita dari kegiatan dan peserta. Admin dapat membuat kegiatan, menutup atau membuka kembali pendaftaran langsung dari kartu kegiatan, mencari dan memfilter peserta (10 peserta per halaman), mengurutkan peserta berdasarkan nama atau sekolah/instansi, serta mengubah urutan manual; menambahkan beberapa tanggal absensi; membagikan link check-in per tanggal; dan mengunduh rekap kehadiran PDF/CSV.
4. Tulis judul, ringkasan, isi berita, kategori, tanggal, gambar opsional (JPEG/PNG/WebP hingga 5 MB), dan/atau link video YouTube atau postingan Instagram (Post, Reel, atau IGTV). Halaman detail menyatukan informasi berita dalam satu panel. Beranda menampilkan berita terbaru; pilih **Lihat semua berita** untuk membuka arsip seluruh postingan di `/berita`.
5. Peserta dapat membuka `http://localhost:3000/kegiatan` untuk memilih kegiatan yang pendaftarannya masih dibuka dan mendaftar satu kali, termasuk memilih jenis kelamin. Pendaftaran tetap terbuka tanpa batas tanggal sampai admin menutupnya dari kartu kegiatan. Untuk check-in pada tanggal tertentu, peserta membuka link absensi yang dibagikan admin dan mengisi email serta nomor telepon yang digunakan saat mendaftar.

### Menambahkan admin

1. Buat akun pengguna melalui **Authentication → Users**.
2. Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah diatur di `.env.local`. Gunakan key baru jika key sebelumnya pernah dibagikan. Key ini hanya boleh digunakan secara lokal/server dan jangan dibagikan atau dimasukkan ke browser.
3. Jalankan `npm run admin:promote -- email-admin@example.com`, ganti dengan email akun yang dibuat.
4. Logout lalu login kembali di `/admin` agar sesi memuat peran yang baru.

### Memindahkan berita lama

`data/news.json` dan `data/uploads` hanya dipakai sebagai sumber migrasi. Setelah menjalankan skema SQL dan membuat admin:

1. Pastikan `SUPABASE_SERVICE_ROLE_KEY` ada di `.env.local`. Kunci ini hanya untuk skrip server lokal dan jangan pernah diawali `NEXT_PUBLIC_` atau dibagikan ke browser.
2. Jalankan `npm run migrate:news`. Skrip mengimpor berita serta gambar lokal ke tabel `posts` dan bucket `news-images`.
3. Hapus `SUPABASE_SERVICE_ROLE_KEY` dari `.env.local` jika tidak lagi diperlukan untuk migrasi atau menambahkan admin. Berita dan gambar selanjutnya langsung disimpan di Supabase.

Pastikan setiap admin ditetapkan dengan App Metadata `role: admin`. API dan kebijakan database/storage memeriksa peran tersebut; akses tulis tidak diberikan hanya karena pengguna berhasil login.#
