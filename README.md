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

### Autopost Facebook dan Instagram

1. Hubungkan akun Instagram Business/Creator ke Facebook Page LontaraIoT dan pastikan akun/Page memenuhi persyaratan publikasi Meta.
2. Buat Meta app dan siapkan **Page Access Token** yang memiliki izin `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, dan `instagram_content_publish`. Izin dan akses lanjutan mungkin perlu ditinjau Meta untuk akun di luar peran pengembang aplikasi.
3. Isi `META_FACEBOOK_PAGE_ID`, `META_INSTAGRAM_USERNAME`, dan `META_PAGE_ACCESS_TOKEN` di `.env.local`, serta tambahkan variabel yang sama ke Vercel. Isi `NEXT_PUBLIC_SITE_URL` dengan URL website yang aktif. Token adalah rahasia server: jangan awali dengan `NEXT_PUBLIC_`, jangan masukkan ke Git, dan jangan bagikan lewat chat.
4. Setelah variabel Vercel disimpan, redeploy aplikasi. Saat berita diterbitkan, sistem mempostingnya ke Facebook Page dan Instagram. Berita tanpa gambar tetap dibagikan ke Facebook, sedangkan Instagram dilewati karena publikasi Instagram memerlukan gambar. Gambar PNG/WebP dikonversi ke JPEG untuk Instagram; tampilan gambar asli di website tidak berubah.
5. Hasil autopost ditampilkan di dashboard admin. Jika Meta gagal menerbitkan ke salah satu platform, berita tetap tersimpan dan tampil di website, dan dashboard menampilkan status kegagalannya.

### Memindahkan berita lama

`data/news.json` dan `data/uploads` hanya dipakai sebagai sumber migrasi. Setelah menjalankan skema SQL dan membuat admin:

1. Tambahkan `SUPABASE_SERVICE_ROLE_KEY` ke `.env.local` untuk sementara. Kunci ini hanya untuk skrip migrasi dan jangan pernah diawali `NEXT_PUBLIC_` atau dibagikan ke browser.
2. Jalankan `npm run migrate:news`. Skrip mengimpor berita serta gambar lokal ke tabel `posts` dan bucket `news-images`.
3. Hapus `SUPABASE_SERVICE_ROLE_KEY` dari `.env.local` setelah migrasi. Berita dan gambar selanjutnya langsung disimpan di Supabase.

Pastikan setiap admin ditetapkan dengan App Metadata `role: admin`. API dan kebijakan database/storage memeriksa peran tersebut; akses tulis tidak diberikan hanya karena pengguna berhasil login.#
