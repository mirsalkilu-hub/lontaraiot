## LontaraIoT

Website Lontara IoT & Robotic Bootcamps menggunakan Supabase untuk data berita, kegiatan, pendaftaran peserta, absensi, autentikasi admin, dan penyimpanan gambar. Setiap berita memiliki halaman detail di `/berita/[slug]`.

### Persiapan Supabase

1. Buat proyek Supabase.
2. Jalankan `supabase/schema.sql` melalui SQL Editor untuk membuat tabel, indeks, bucket gambar publik, dan kebijakan Row Level Security. Skrip aman dijalankan ulang dan menambahkan kolom `published_at`, `author_id`, serta `created_at` jika tabel `posts` lama belum memilikinya. Berita lama tetap dipertahankan; berita yang diterbitkan melalui admin akan mencatat akun penulisnya. Tabel `activities` dan `registrations` menyimpan kegiatan serta satu kali pendaftaran peserta; `activity_sessions` dan `attendance_records` menyimpan tanggal dan status absensi per sesi. Status absensi lama akan dipindahkan ke tanggal kegiatan utama saat skema ini dijalankan.
3. Buat akun pengguna melalui **Authentication → Users**. Matikan pendaftaran publik di pengaturan **Authentication → Sign In / Providers**.
4. Salin `.env.example` menjadi `.env.local`, lalu isi URL proyek dan publishable/anon key dari **Project Settings → API Keys**. Untuk memberikan peran admin, ikuti bagian [Menambahkan admin](#menambahkan-admin).

### Menjalankan lokal

1. Pasang dependensi dengan `npm install`.
2. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.
3. Buka `http://localhost:3000/admin`, lalu masuk menggunakan email dan kata sandi akun admin Supabase. Admin dapat membuat kegiatan, melihat daftar peserta dengan pencarian dan filter kegiatan, mengatur pendaftaran, menambahkan beberapa tanggal absensi, menyalin link check-in per tanggal untuk dibagikan, menutup atau membuka link, dan mengunduh PDF/CSV rekap kehadiran.
4. Tulis judul, ringkasan, isi berita, kategori, tanggal, dan gambar opsional (JPEG/PNG/WebP hingga 5 MB). Artikel yang diterbitkan akan muncul di halaman utama dan memiliki halaman detail sendiri.
5. Peserta dapat membuka `http://localhost:3000/kegiatan` untuk memilih kegiatan yang pendaftarannya masih dibuka dan mendaftar satu kali, termasuk memilih jenis kelamin. Untuk check-in pada tanggal tertentu, peserta membuka link absensi yang dibagikan admin dan mengisi email serta nomor telepon yang digunakan saat mendaftar.

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
