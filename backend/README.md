# SAGA Backend — Sistem Arsip Kontrak & MoU

Backend REST API untuk aplikasi SAGA (Sistem Arsip Kontrak dan MoU) berbasis Laravel 13, PostgreSQL, dan Redis.

## Persyaratan Sistem

- PHP 8.3 atau 8.4 (ekstensi: `pdo_pgsql`, `pgsql`, `mbstring`, `exif`, `gd`, `zip`, `pcntl`)
- Composer v2
- PostgreSQL 16
- Redis 7
- Docker & Docker Compose v2 (opsional, untuk menjalankan via container)

---

## Langkah Menjalankan dari Nol (Clean Setup)

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan backend secara lokal dari nol:

### 1. Masuk ke direktori backend
```bash
cd backend
```

### 2. Salin dan sesuaikan file environment
```bash
cp .env.example .env
```
Pastikan kredensial database PostgreSQL (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) dan Redis (`REDIS_HOST`, `REDIS_PORT`) di `.env` sudah sesuai dengan environment lokal Anda.

### 3. Instal dependensi Composer
```bash
composer install
```

### 4. Buat Application Key
```bash
php artisan key:generate
```

### 5. Jalankan migrasi database dan seed data awal
```bash
php artisan migrate --seed
```
Perintah ini akan menjalankan seluruh migrasi skema tabel serta `InitialDataSeeder` untuk mengisi master jenis kontrak, proyek awal, dan akun demo pengujian.

### 6. Pasang storage symlink
```bash
php artisan storage:link
```

### 7. Jalankan development server
```bash
php artisan serve --host=127.0.0.1 --port=8000
```
Backend API sekarang aktif di `http://127.0.0.1:8000`.

---

## Menjalankan dengan Docker Compose

Jika menggunakan Docker, backend dapat dijalankan langsung bersama database PostgreSQL dan Redis dari root repository:

```bash
# Dari root direktori repository
cp .env.example .env
docker compose up --build -d
```

Verifikasi kesehatan layanan backend:
```bash
curl -i http://localhost:8001/up
```

---

## Akun Demo Pengujian

Setelah seeder dijalankan (`php artisan migrate --seed` atau `InitialDataSeeder`), akun berikut tersedia untuk login:

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `password123` |
| Viewer | `viewer@example.com` | `password123` |
| Viewer | `asep@example.com` | `password123` |

---

## Endpoint API Utama

- **Health Check**: `GET /up`
- **Login**: `POST /api/v1/login` (body: `email`, `password`)
- **Profil User**: `GET /api/v1/me` (header: `Authorization: Bearer <token>`)
- **Logout**: `POST /api/v1/logout`
- **Ganti Password**: `POST /api/v1/change-password`
- **Daftar Dokumen**: `GET /api/v1/documents`
- **Upload Dokumen**: `POST /api/v1/documents`
- **Statistik Dashboard**: `GET /api/v1/dashboard/statistics`

---

## Pengujian dan Code Quality

Jalankan pemeriksaan kode dan test otomatis:

```bash
# Code style formatting (Pint)
./vendor/bin/pint --test

# Automated feature tests
php artisan test
```
