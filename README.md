## LontaraIoT

Website Lontara IoT & Robotic Bootcamps menggunakan Supabase untuk data berita, autentikasi admin, dan penyimpanan gambar. Setiap berita memiliki halaman detail di `/berita/[slug]`.

### Persiapan Supabase

1. Buat proyek Supabase.
2. Jalankan `supabase/schema.sql` melalui SQL Editor untuk membuat tabel, indeks, bucket gambar publik, dan kebijakan Row Level Security. Skrip aman dijalankan ulang dan menambahkan kolom `published_at`, `author_id`, serta `created_at` jika tabel `posts` lama belum memilikinya. Berita lama tetap dipertahankan; berita yang diterbitkan melalui admin akan mencatat akun penulisnya.
3. Buat akun admin melalui **Authentication → Users**. Matikan pendaftaran publik di pengaturan **Authentication → Sign In / Providers**.
4. Di pengaturan pengguna tersebut, tetapkan **App Metadata** menjadi `{"role":"admin"}`. Jangan gunakan User Metadata untuk peran admin.
5. Salin `.env.example` menjadi `.env.local`, lalu isi URL proyek dan publishable/anon key dari **Project Settings → API Keys**. Service role key hanya diperlukan untuk migrasi berita lama.

### Menjalankan lokal

1. Pasang dependensi dengan `npm install`.
2. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.
3. Buka `http://localhost:3000/admin`, lalu masuk menggunakan email dan kata sandi akun admin Supabase.
4. Tulis judul, ringkasan, isi berita, kategori, tanggal, dan gambar opsional (JPEG/PNG/WebP hingga 5 MB). Artikel yang diterbitkan akan muncul di halaman utama dan memiliki halaman detail sendiri.

### Memindahkan berita lama

`data/news.json` dan `data/uploads` hanya dipakai sebagai sumber migrasi. Setelah menjalankan skema SQL dan membuat admin:

1. Tambahkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local` untuk sementara. Kunci ini hanya untuk skrip migrasi dan jangan pernah diawali `NEXT_PUBLIC_` atau dibagikan ke browser.
2. Jalankan `npm run migrate:news`. Skrip mengimpor berita serta gambar lokal ke tabel `posts` dan bucket `news-images`.
3. Hapus `SUPABASE_SERVICE_ROLE_KEY` dari `.env.local` setelah migrasi. Berita dan gambar selanjutnya langsung disimpan di Supabase.

Pastikan setiap admin ditetapkan dengan App Metadata `role: admin`. API dan kebijakan database/storage memeriksa peran tersebut; akses tulis tidak diberikan hanya karena pengguna berhasil login.#
