# Verifikasi Issue Lama Audit 496

Tanggal verifikasi: 15 November 2026  
Basis kode: `main` setelah PR #159 (`31627b8`)  
Metode: inspeksi kode, test otomatis, dan riwayat PR/commit.

## Ringkasan

22 issue lama yang dibuka kembali otomatis pada 14 November 2026 sudah diperiksa ulang. Seluruh temuannya sudah memiliki implementasi di `main`. Dua issue P0 yang masih terbuka juga diselesaikan/diverifikasi di PR ini:

- **#102** — mass assignment `role` sudah ditutup dan diuji.
- **#105** — state sesi tidak lagi bisa ditimpa response async dari sesi lama.

## Tabel verifikasi

| Issue | Temuan | Bukti di `main` | Status |
|---|---|---|---|
| #1 | SoftDeletes + explicit casts | `Project`, `Document`, `DocumentVersion`, `Client`, `ContractType` memakai `SoftDeletes`; casts ada di `Document`, `Project`, `DocumentVersion`, `User`; `ClientContractTypeTest` menguji soft delete | ✅ |
| #3 | Secure storage + checksum PDF | `DocumentService.php:383` menghitung `hash_file('sha256', ...)`; `DocumentUploadTest` menguji hash tersimpan | ✅ |
| #5 | Dashboard Next.js, upload versi, PDF viewer | Route `/`, `/contracts`, `/documents/[id]`; `DocumentDetailClient.tsx:413` merender PDF via `iframe`; modal upload dokumen/versi tersedia | ✅ |
| #16 | Route versioning `/api/v1` | `backend/routes/api.php:16` memakai `Route::prefix('v1')` | ✅ |
| #24 | Token invalidation saat logout | `AuthService.php:48` menghapus `currentAccessToken()`; `DELETE /api/session` mencabut token backend lalu menghapus cookie | ✅ |
| #28 | Test upload non-PDF ditolak 422 | `DocumentUploadTest::test_cannot_upload_non_pdf_file` + `assertStatus(422)` | ✅ |
| #64 | README, `.env.example`, cara run | `README.md`, `.env.example`, `compose.yaml` tersedia dan berisi langkah instalasi | ✅ |
| #65 | FormRequest + Policy/RBAC + API Resource | 12 FormRequest, 2 Policy, 8 Resource; controller memakai `Gate::authorize` | ✅ |
| #66 | Error schema, pagination, throttle, CORS | `per_page` divalidasi di 6 request; throttle dipasang di route; `config/cors.php` memakai whitelist origin | ✅ |
| #67 | Frontend memakai API real + loading/error + 401 | `lib/api.ts` memakai BFF `/api/backend`; interceptor 401 menghapus sesi dan redirect ke login; halaman memakai loading/error state | ✅ |
| #68 | Test, `DB::transaction`, preventLazyLoading | `AppServiceProvider.php:60`; repository memakai `DB::transaction`; `QualityStandardsTest` menguji lazy-loading prevention | ✅ |
| #69 | Compose sekali jalan + higiene repo | `compose.yaml` punya service `migrate` dengan `--isolated` dan `service_completed_successfully`; `DeploymentStandardsTest` menguji keduanya | ✅ |
| #74 | Endpoint admin users tidak bisa diakses viewer | `UserController::index` memanggil `Gate::authorize('viewAny', User::class)`; `UserPolicy::viewAny` hanya `admin`; `UserAuthorizationTest` menguji viewer ditolak | ✅ |
| #75 | `DocumentController::update` tanpa Gate | `DocumentController.php:111` memanggil `Gate::authorize('update', $document)` | ✅ |
| #76 | `preview()` tidak memeriksa Policy | `DocumentFileController.php:22` memanggil `Gate::authorize('view', $document)`; `DocumentPolicy::view` memblokir dokumen NDA/rahasia untuk non-admin | ✅ |
| #77 | File sampah berisi hash password | Tidak ada file `User::create([` di `git ls-files` | ✅ |
| #84 | CI test + build otomatis | `.github/workflows/ci.yml` menjalankan Backend Tests dan Frontend Lint and Build; CI run `43702758968` sukses | ✅ |
| #85 | Artefak AI-assistant dihapus | Tidak ada `.claude/CLAUDE.md` di `git ls-files` | ✅ |
| #91 | Metadata default Next.js | `app/layout.tsx` memakai `metadataBase`, title template, dan description; layout per route menambahkan canonical | ✅ |
| #92 | Sinkronisasi notifikasi di GET /notifications | `routes/console.php` menjadwalkan `documents:check-expiry` harian; `NotificationExpiryTest` memastikan GET tidak membuat notifikasi | ✅ |
| #93 | Admin bisa menghapus akun sendiri | `UserPolicy::delete` menolak `user->id === target->id`; `UserAuthorizationTest` menguji admin tidak bisa menghapus akun yang sedang dipakai dan admin terakhir | ✅ |
| #94 | Route boundaries per segmen | `frontend/src/app/loading.tsx`, `error.tsx`, dan `not-found.tsx` tersedia | ✅ |
| #102 | Mass assignment `role` tertutup | `MassAssignmentTest` menguji `role` tidak fillable dan input `role=admin` diabaikan; CI backend lulus | ✅ |
| #105 | State tidak membawa data lama setelah logout | `sessionClient.ts` memakai `sessionVersion` untuk mengabaikan response async basi; `sessionClient.test.ts` menguji logout lalu login akun lain | ✅ |

## Cara cek ulang

```bash
# Backend
grep -RIn "SoftDeletes" backend/app/Models
grep -n "hash_file" backend/app/Services/DocumentService.php
grep -n "prefix('v1')" backend/routes/api.php
php artisan test --filter=MassAssignmentTest
php artisan test --filter=UserAuthorizationTest
php artisan test --filter=NotificationExpiryTest

# Frontend
cd frontend
npm test
npm run build
```

## Catatan audit

Audit ulang otomatis 14 November membuka issue karena closure sebelumnya tidak menyertakan commit yang menyebut nomor issue. Verifikasi ini melengkapi bukti tersebut: commit verifikasi menyebut seluruh nomor issue, dan setiap issue mendapat komentar berisi hasil pengecekan ulang.
