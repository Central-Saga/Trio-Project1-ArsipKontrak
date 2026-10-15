# SAGA — Sistem Arsip Kontrak dan MoU

SAGA adalah aplikasi web untuk membantu pengelolaan arsip kontrak, Memorandum of Understanding (MoU), proyek, dan riwayat dokumen secara terpusat.

## Fitur

- Autentikasi pengguna dan pengaturan hak akses.
- Pengelolaan proyek dan informasi klien.
- Pengelolaan arsip kontrak, MoU, dan dokumen pendukung.
- Pencatatan versi dokumen.
- Pengelolaan jenis kontrak.
- Pemantauan status dan tanggal berlaku dokumen.
- Pencatatan aktivitas dan notifikasi sesuai fitur aplikasi.

## Teknologi

- Backend: Laravel dan PHP.
- Frontend: Next.js, React, dan TypeScript.
- Database: PostgreSQL.
- Container: Docker dan Docker Compose.

## Persyaratan

Pastikan Git, Docker, dan Docker Compose v2 sudah terpasang.

Periksa instalasi dengan perintah berikut di terminal:

    git --version
    docker --version
    docker compose version

## Menjalankan aplikasi dengan Docker

### 1. Siapkan environment

Salin template environment jika file `.env` belum tersedia:

    cp .env.example .env

Jika `.env` sudah ada, periksa konfigurasi yang diperlukan tanpa menimpa file tersebut.

### 2. Build dan jalankan aplikasi

    docker compose up --build -d

Periksa status layanan:

    docker compose ps

Tunggu sampai database dan backend siap sebelum membuka aplikasi.

### 3. Buka aplikasi

| Layanan | URL |
| --- | --- |
| Frontend | http://localhost:3001 |
| Backend health check | http://localhost:8001/up |
| API backend | http://localhost:8001/api/v1 |

### 4. Siapkan data demo

Untuk mengisi atau memperbarui data demo pada database lokal:

    docker compose exec app php artisan db:seed --class=InitialDataSeeder

Jangan jalankan seeder pada database produksi tanpa memeriksa dampaknya terlebih dahulu.

## Akun demo lokal

| Peran | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `password123` |
| Viewer | `viewer@example.com` | `password123` |
| Viewer | `asep@example.com` | `password123` |

Akun ini hanya untuk pengujian lokal. Ganti kredensial demo sebelum deployment ke lingkungan produksi.

## Perintah pengelolaan aplikasi

Periksa status container:

    docker compose ps

Lihat log seluruh layanan:

    docker compose logs --tail=100

Lihat log backend:

    docker compose logs --tail=100 app

Lihat log frontend:

    docker compose logs --tail=100 frontend

Periksa status migrasi database:

    docker compose exec app php artisan migrate:status

Hentikan layanan tanpa menghapus volume:

    docker compose stop

Jalankan kembali layanan yang sudah dihentikan:

    docker compose start

## Troubleshooting

### Port sudah digunakan

Periksa container yang sedang berjalan sebelum menghentikan layanan apa pun:

    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Jika port frontend atau backend sudah digunakan, pastikan container tersebut tidak menjalankan aplikasi lain yang masih dibutuhkan.

### Backend belum siap

Periksa status dan log backend:

    docker compose ps
    docker compose logs --tail=100 app

### Database gagal terhubung

Periksa nilai `POSTGRES_DB`, `POSTGRES_USER`, dan `POSTGRES_PASSWORD` pada file `.env`.

Mengubah password di `.env` tidak otomatis mengubah password PostgreSQL yang sudah tersimpan dalam volume sebelumnya.

### Frontend tidak dapat terhubung ke API

Pastikan `NEXT_PUBLIC_API_BASE_URL` mengarah ke API yang benar. Jika nilainya diubah, build ulang frontend agar konfigurasi baru diterapkan.

## Penyimpanan dan keamanan data

Docker Compose menggunakan named volume untuk menyimpan data PostgreSQL dan runtime Laravel. Data database dapat tetap dipertahankan saat container dihentikan selama volume tidak dihapus.

Buat backup sebelum melakukan perubahan struktur database atau pemulihan data.

Hindari perintah `docker compose down -v` jika data masih diperlukan karena perintah tersebut dapat menghapus volume database.

Hindari menjalankan `php artisan migrate:fresh` pada database yang berisi data penting karena perintah tersebut menghapus tabel sebelum membuatnya kembali.

Jangan commit file `.env`, password pribadi, atau kredensial produksi. Akun demo dalam dokumentasi hanya untuk pengembangan lokal.

## Screenshot aplikasi

Berikut adalah screenshot aplikasi SAGA yang berjalan di lingkungan lokal:

![Tampilan aplikasi SAGA](docs/screenshots/dashboard.png)

## Struktur repository

    .
    ├── backend/       # Backend Laravel dan API
    ├── frontend/      # Frontend Next.js
    ├── compose.yaml   # Konfigurasi Docker Compose
    ├── .env.example   # Template environment lokal
    └── README.md      # Dokumentasi utama

## Lisensi

Periksa ketentuan lisensi repository sebelum mendistribusikan atau menggunakan aplikasi ini di luar lingkungan pengembangan.
