<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\DocumentVersionRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private DocumentVersionRepositoryInterface $versions
    ) {
    }

    /**
     * Fungsi bantu untuk menentukan status otomatis berdasarkan tanggal atau pilihan manual.
     */
    private function determineStatus($startDate, $expiryDate, $currentStatus = null)
    {
        // Jika status sudah ditentukan secara manual (expired, terminated, draft, active), hargai pilihan tersebut
        if ($currentStatus && in_array(strtolower($currentStatus), ['expired', 'terminated', 'draft', 'active'])) {
            return strtolower($currentStatus);
        }

        $today = Carbon::today();
        $start = $startDate ? Carbon::parse($startDate)->startOfDay() : null;
        $expiry = $expiryDate ? Carbon::parse($expiryDate)->startOfDay() : null;

        // 1. Jika tanggal mulai masih di masa depan -> Draft / Upcoming
        if ($start && $start->greaterThan($today)) {
            return 'draft';
        }

        // 2. Jika tanggal kedaluwarsa sudah terlewati -> Expired
        if ($expiry && $expiry->lessThan($today)) {
            return 'expired';
        }

        // 3. Jika sedang berjalan -> Active
        return 'active';
    }

    public function statistics()
    {
        $statistics = $this->documents->statistics();

        $statusDistribution = [
            ['name' => 'Active', 'value' => $statistics['dokumen_aktif'], 'color' => '#10b981'],
            ['name' => 'Inactive', 'value' => $statistics['dokumen_inactive'], 'color' => '#64748b'],
            ['name' => 'Draft', 'value' => $statistics['dokumen_draft'], 'color' => '#f59e0b'],
            ['name' => 'Expired', 'value' => $statistics['dokumen_expired'], 'color' => '#f43f5e'],
            ['name' => 'Terminated', 'value' => $statistics['dokumen_terminated'], 'color' => '#475569'],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'total_arsip' => $statistics['total_arsip'],
                'total_kontrak' => $statistics['total_kontrak'],
                'dokumen_aktif' => $statistics['dokumen_aktif'],
                'inactive' => $statistics['dokumen_inactive'],
                'draft' => $statistics['dokumen_draft'],
                'expired' => $statistics['dokumen_expired'],
                'terminated' => $statistics['dokumen_terminated'],
                'distribution' => $statusDistribution,
            ]
        ]);
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', Document::class);

        $documents = $this->documents->paginateForUser(
            $request->user(),
            $request->only(['search', 'status', 'document_type']),
            15
        );

        return DocumentResource::collection($documents)->additional([
            'success' => true,
            'message' => 'Daftar dokumen berhasil diambil.',
        ]);
    }

    public function trashed(Request $request)
    {
        Gate::authorize('viewTrash', Document::class);

        return DocumentResource::collection(
            $this->documents->trashed(100)
        );
    }

    public function restore(Request $request, string $id)
    {
        $document = $this->documents->findOnlyTrashed($id);
        Gate::authorize('restore', $document);

        $this->documents->restore($document);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen berhasil dikembalikan.',
            'data' => new DocumentResource(
                $document->load(['project', 'creator', 'versions'])
            ),
        ]);
    }

    public function store(StoreDocumentRequest $request)
    {
        $validated = $request->validated();

        Gate::authorize('create', Document::class);

        $file = $request->file('file');
        $path = null;

        try {
            $document = $this->documents->transaction(function () use (
                $validated, $request, $file, &$path
            ) {
                $effectiveDate = $validated['effective_date']
                    ?? $validated['document_date'];

                $status = $this->determineStatus(
                    $effectiveDate,
                    $validated['expiry_date'],
                    $validated['status'] ?? null
                );

                $document = $this->documents->create([
                    'document_number' => $validated['document_number'],
                    'document_name' => $validated['document_name'],
                    'document_type' => $validated['document_type'],
                    'partner' => $validated['partner'],
                    'document_date' => $validated['document_date'],
                    'effective_date' => $effectiveDate,
                    'expiry_date' => $validated['expiry_date'],
                    'status' => $status,
                    'description' => $validated['description'] ?? null,
                    'project_id' => $validated['project_id'],
                    'created_by' => $request->user()->id,
                ]);

                $content = file_get_contents($file->getRealPath());
                if ($content === false) {
                    throw new \RuntimeException('File tidak dapat dibaca.');
                }

                $key = config('app.key');
                if (str_starts_with($key, 'base64:')) {
                    $key = base64_decode(substr($key, 7), true);
                }

                if ($key === false || $key === '') {
                    throw new \RuntimeException('Kunci enkripsi aplikasi tidak valid.');
                }

                $iv = random_bytes(openssl_cipher_iv_length('aes-256-cbc'));
                $encrypted = openssl_encrypt(
                    $content,
                    'aes-256-cbc',
                    $key,
                    0,
                    $iv
                );

                if ($encrypted === false) {
                    throw new \RuntimeException('Enkripsi file gagal.');
                }

                $payload = base64_encode($iv . $encrypted);
                $path = 'documents/contracts/' . bin2hex(random_bytes(16)) . '.enc';

                if (! Storage::disk('private_encrypted')->put($path, $payload)) {
                    throw new \RuntimeException('File terenkripsi gagal disimpan.');
                }

                $hash = hash_file('sha256', $file->getRealPath());
                if ($hash === false) {
                    throw new \RuntimeException('Hash SHA-256 gagal dihitung.');
                }

                $this->versions->create([
                    'document_id' => $document->id,
                    'version_number' => 'v1.0',
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'file_hash' => $hash,
                    'mime_type' => $file->getMimeType(),
                    'encrypted_at' => now(),
                    'is_current' => true,
                    'notes' => $validated['notes'] ?? 'Dokumen awal diunggah.',
                    'uploaded_by' => $request->user()->id,
                ]);

                return $document;
            });

            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil diunggah dan dienkripsi.',
                'data' => new DocumentResource(
                    $document->load(['project', 'creator', 'versions.uploader'])
                ),
            ], 201);
        } catch (\Throwable $e) {
            // Rollback database ditangani otomatis oleh transaksi repository.
            // File bukan bagian dari transaksi database, jadi bersihkan secara manual.
            if ($path && Storage::disk('private_encrypted')->exists($path)) {
                Storage::disk('private_encrypted')->delete($path);
            }

            report($e);

            if (app()->environment('testing')) {
                throw $e;
            }

            return response()->json([
                'message' => 'Gagal menyimpan dokumen.',
            ], 500);
        }
    }

    public function show(string $id)
    {
        $document = $this->documents->findWithRelations($id, [
            'project',
            'creator',
            'versions.uploader',
        ]);

        // Pastikan policy dokumen benar-benar diberlakukan.
        Gate::authorize('view', $document);

        $user = request()->user();

        if ($user) {
            \App\Models\ActivityLog::record(
                userId: $user->id,
                action: 'VIEW_DOCUMENT',
                description: "Pengguna {$user->name} ({$user->role}) melihat detail dokumen: {$document->document_name}",
                documentId: $document->id
            );
        }

        if (
            $document->expiry_date
            && Carbon::parse($document->expiry_date)->isPast()
            && in_array($document->status, ['active', 'draft'], true)
        ) {
            $this->documents->update($document, ['status' => 'expired']);
            $document->refresh();
            $document->load(['project', 'creator', 'versions.uploader']);
        }

        return new DocumentResource($document);
    }

    /**
     * Metadata minimum untuk judul halaman frontend.
     * Tetap menggunakan policy dan tidak mencatat VIEW_DOCUMENT.
     */
    public function metadata(string $id)
    {
        $document = $this->documents->findForMetadata($id);

        Gate::authorize('view', $document);

        return response()->json([
            'success' => true,
            'data' => [
                'document_name' => $document->document_name,
            ],
        ], 200, [
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function preview(Request $request, string $id)
    {
        $document = $this->documents->findWithRelations($id, ['versions']);
        Gate::authorize('view', $document);

        try {
            $user = $request->user();
            if ($user) {
                \App\Models\ActivityLog::record(
                    userId: $user->id,
                    action: 'PREVIEW_PDF',
                    description: "Pengguna {$user->name} ({$user->role}) membuka pratinjau dokumen: {$document->document_name}",
                    documentId: $document->id
                );
            }

            $version = $this->versions->findCurrentOrLatest(
                $document,
                $this->requestedVersionId($request)
            );

            if (!$version || !Storage::disk('private_encrypted')->exists($version->file_path)) {
                return response()->json(['message' => 'Berkas fisik tidak ditemukan.'], 404);
            }

            $payload = Storage::disk('private_encrypted')->get($version->file_path);

            $encryptionKey = config('app.key');
            if (str_starts_with($encryptionKey, 'base64:')) {
                $encryptionKey = base64_decode(substr($encryptionKey, 7));
            }

            $decodedPayload = base64_decode($payload);
            $ivLength = openssl_cipher_iv_length('aes-256-cbc');
            $iv = substr($decodedPayload, 0, $ivLength);
            $encryptedContent = substr($decodedPayload, $ivLength);

            $decryptedContent = openssl_decrypt($encryptedContent, 'aes-256-cbc', $encryptionKey, 0, $iv);

            if ($decryptedContent === false) {
                return response()->json(['message' => 'Gagal mendekripsi berkas PDF.'], 500);
            }

            $safeFilename = preg_replace('/[\r\n\t[:cntrl:]]+/', '', basename($version->file_name));

            return response($decryptedContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . addslashes($safeFilename) . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memuat pratinjau: ' . $e->getMessage()
            ], 500);
        }
    }

    public function download(Request $request, string $id)
    {
        $document = $this->documents->findWithRelations($id, ['versions']);
        Gate::authorize('download', $document);

        try {
            $user = $request->user();

            if ($user) {
                \App\Models\ActivityLog::record(
                    userId: $user->id,
                    action: 'DOWNLOAD_DOCUMENT',
                    description: "Administrator {$user->name} mengunduh berkas dokumen: {$document->document_name}",
                    documentId: $document->id
                );
            }

            $version = $this->versions->findCurrentOrLatest(
                $document,
                $this->requestedVersionId($request)
            );

            if (!$version || !Storage::disk('private_encrypted')->exists($version->file_path)) {
                return response()->json(['message' => 'Berkas fisik tidak ditemukan.'], 404);
            }

            $payload = Storage::disk('private_encrypted')->get($version->file_path);

            $encryptionKey = config('app.key');
            if (str_starts_with($encryptionKey, 'base64:')) {
                $encryptionKey = base64_decode(substr($encryptionKey, 7));
            }

            $decodedPayload = base64_decode($payload);
            $ivLength = openssl_cipher_iv_length('aes-256-cbc');
            $iv = substr($decodedPayload, 0, $ivLength);
            $encryptedContent = substr($decodedPayload, $ivLength);

            $decryptedContent = openssl_decrypt($encryptedContent, 'aes-256-cbc', $encryptionKey, 0, $iv);

            if ($decryptedContent === false) {
                return response()->json(['message' => 'Gagal mendekripsi berkas PDF.'], 500);
            }

            $safeFilename = preg_replace('/[\r\n\t[:cntrl:]]+/', '', basename($version->file_name));

            return response($decryptedContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . addslashes($safeFilename) . '"',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengunduh: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(UpdateDocumentRequest $request, string $id)
    {
        $document = $this->documents->findOrFail($id);
        Gate::authorize('update', $document);

        $validated = $request->validated();

        $startDate = $validated['document_date'] ?? $validated['effective_date'] ?? $document->document_date;
        $expiryDate = $validated['expiry_date'] ?? $document->expiry_date;

        // Ambil status manual yang dikirim dari form edit
        $requestedStatus = $validated['status'] ?? $request->input('status') ?? $document->status;

        // Evaluasi status dengan memprioritaskan pilihan manual pengguna saat update
        $validated['status'] = $this->determineStatus($startDate, $expiryDate, $requestedStatus);

        $this->documents->update($document, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Metadata dokumen berhasil diperbarui.',
            'data' => new DocumentResource($document->load(['project', 'creator'])),
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $document = $this->documents->findWithRelations($id, ['versions']);

        Gate::authorize('delete', $document);

        try {
            $this->documents->transaction(function () use ($document) {
                // Soft delete tidak menghapus file fisik atau riwayat versi.
                $this->documents->delete($document);
            });

            return response()->json([
                'success' => true,
                'message' => 'Dokumen dipindahkan ke tempat sampah; file fisik dan riwayat versinya dipertahankan.',
                'data' => null,
            ]);
        } catch (\Throwable $e) {
            report($e);

            if (app()->environment('testing')) {
                throw $e;
            }

            return response()->json([
                'message' => 'Gagal menghapus dokumen.',
            ], 500);
        }
    }

    /**
     * Ambil ID versi dari query string secara aman.
     */
    private function requestedVersionId(Request $request): ?string
    {
        $versionId = $request->query('version_id');

        return is_string($versionId) && $versionId !== '' ? $versionId : null;
    }
}
