<?php

namespace App\Services;

use App\DTO\CreateDocumentData;
use App\DTO\CreateDocumentVersionData;
use App\DTO\DocumentFileData;
use App\DTO\DocumentListQueryData;
use App\DTO\DocumentVersionListQueryData;
use App\DTO\EncryptedFileData;
use App\DTO\UpdateDocumentData;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\User;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\DocumentVersionRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentService
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private DocumentVersionRepositoryInterface $versions,
        private ActivityLogService $activityLogs,
    ) {}

    public function statistics(): array
    {
        return $this->documents->statistics();
    }

    public function listDocuments(?User $user, DocumentListQueryData $query): LengthAwarePaginator
    {
        return $this->documents->paginateForUser($user, $query);
    }

    public function trashed(DocumentListQueryData $query): Collection
    {
        return $this->documents->trashed($query);
    }

    /**
     * Catat akses detail dan sinkronkan status kedaluwarsa.
     */
    public function viewDetail(Document $document, ?User $user): Document
    {
        if ($user) {
            $this->activityLogs->record(
                $user,
                'VIEW_DOCUMENT',
                "Pengguna {$user->name} ({$user->role}) melihat detail dokumen: {$document->document_name}",
                $document->id
            );
        }

        if (
            $document->expiry_date
            && Carbon::parse($document->expiry_date)->isPast()
            && in_array($document->status, ['active', 'draft'], true)
        ) {
            $this->documents->update($document, ['status' => 'expired']);
            $document->refresh();

            return $document->load(['project', 'creator', 'versions.uploader']);
        }

        return $document;
    }

    public function metadata(string $id): Document
    {
        return $this->documents->findForMetadata($id);
    }

    public function updateDocument(Document $document, UpdateDocumentData $data): Document
    {
        $startDate = $data->documentDate ?? $data->effectiveDate ?? $document->document_date;
        $expiryDate = $data->expiryDate ?? $document->expiry_date;
        $requestedStatus = $data->status ?? $document->status;

        $attributes = $data->toAttributes();
        $attributes['status'] = $this->determineStatus($startDate, $expiryDate, $requestedStatus);

        $this->documents->update($document, $attributes);

        return $document->load(['project', 'creator']);
    }

    public function deleteDocument(Document $document): void
    {
        $this->documents->transaction(function () use ($document): void {
            // Soft delete tidak menghapus file fisik atau riwayat versi.
            $this->documents->delete($document);
        });
    }

    public function restoreDocument(Document $document): Document
    {
        $this->documents->restore($document);

        return $document->load(['project', 'creator', 'versions']);
    }

    public function versionsFor(
        Document $document,
        DocumentVersionListQueryData $query
    ): Collection {
        return $this->versions->forDocument($document, $query);
    }

    /**
     * Ambil konten PDF untuk pratinjau.
     */
    public function previewFile(
        Document $document,
        ?string $versionId,
        ?User $user
    ): ?DocumentFileData {
        return $this->filePayload(
            $document,
            $versionId,
            $user,
            'PREVIEW_PDF',
            'membuka pratinjau dokumen'
        );
    }

    /**
     * Ambil konten PDF untuk unduhan.
     */
    public function downloadFile(
        Document $document,
        ?string $versionId,
        ?User $user
    ): ?DocumentFileData {
        return $this->filePayload(
            $document,
            $versionId,
            $user,
            'DOWNLOAD_DOCUMENT',
            'mengunduh berkas dokumen'
        );
    }

    /**
     * Buat dokumen baru beserta versi pertamanya dalam satu transaksi.
     */
    public function createDocument(
        CreateDocumentData $data,
        UploadedFile $file,
        int $userId
    ): Document {
        $storedPath = null;

        try {
            return $this->documents->transaction(function () use (
                $data,
                $file,
                $userId,
                &$storedPath
            ) {
                $document = $this->documents->create([
                    'project_id' => $data->projectId,
                    'document_number' => $data->documentNumber,
                    'document_name' => $data->documentName,
                    'document_type' => $data->documentType,
                    'partner' => $data->partner,
                    'document_date' => $data->documentDate,
                    'effective_date' => $data->effectiveDate,
                    'expiry_date' => $data->expiryDate,
                    'status' => $this->determineStatus(
                        $data->effectiveDate,
                        $data->expiryDate,
                        $data->status
                    ),
                    'description' => $data->description,
                    'created_by' => $userId,
                ]);

                $encryptedFile = $this->encryptAndStore($file);
                $storedPath = $encryptedFile->path;

                $this->versions->create([
                    'document_id' => $document->id,
                    'version_number' => $data->versionNumber,
                    'file_path' => $encryptedFile->path,
                    'file_name' => $encryptedFile->originalName,
                    'file_size' => $encryptedFile->size,
                    'file_hash' => $encryptedFile->hash,
                    'mime_type' => $encryptedFile->mimeType,
                    'encrypted_at' => now(),
                    'is_current' => true,
                    'notes' => $data->notes,
                    'uploaded_by' => $userId,
                ]);

                return $document;
            });
        } catch (\Throwable $e) {
            // File bukan bagian dari transaksi database, bersihkan manual.
            $this->deleteStoredFile($storedPath);

            throw $e;
        }
    }

    /**
     * Tambahkan versi baru dan jadikan versi tersebut sebagai versi aktif.
     */
    public function addVersion(
        Document $document,
        CreateDocumentVersionData $data,
        UploadedFile $file,
        int $userId
    ): DocumentVersion {
        $storedPath = null;

        try {
            return $this->versions->transaction(function () use (
                $document,
                $data,
                $file,
                $userId,
                &$storedPath
            ) {
                $encryptedFile = $this->encryptAndStore($file);
                $storedPath = $encryptedFile->path;

                $this->versions->markAllNotCurrent($document);

                $versionNumber = $data->versionNumber
                    ?? 'v'.($this->versions->countForDocument($document) + 1).'.0';

                return $this->versions->create([
                    'document_id' => $document->id,
                    'version_number' => $versionNumber,
                    'file_path' => $encryptedFile->path,
                    'file_name' => $encryptedFile->originalName,
                    'file_size' => $encryptedFile->size,
                    'file_hash' => $encryptedFile->hash,
                    'mime_type' => $encryptedFile->mimeType,
                    'encrypted_at' => now(),
                    'is_current' => true,
                    'notes' => $data->notes,
                    'uploaded_by' => $userId,
                ]);
            });
        } catch (\Throwable $e) {
            $this->deleteStoredFile($storedPath);

            throw $e;
        }
    }

    private function filePayload(
        Document $document,
        ?string $versionId,
        ?User $user,
        string $action,
        string $activity
    ): ?DocumentFileData {
        $version = $this->versions->findCurrentOrLatest($document, $versionId);

        if (! $version || ! Storage::disk('private_encrypted')->exists($version->file_path)) {
            return null;
        }

        if ($user) {
            $this->activityLogs->record(
                $user,
                $action,
                "Pengguna {$user->name} ({$user->role}) {$activity}: {$document->document_name}",
                $document->id
            );
        }

        $safeFilename = preg_replace('/[\r\n\t[:cntrl:]]+/', '', basename($version->file_name));

        return new DocumentFileData(
            content: $this->decryptFile($version),
            fileName: $safeFilename !== '' ? $safeFilename : 'dokumen.pdf',
            mimeType: $version->mime_type ?: 'application/pdf',
        );
    }

    private function decryptFile(DocumentVersion $version): string
    {
        $payload = Storage::disk('private_encrypted')->get($version->file_path);

        if (! is_string($payload)) {
            throw new \RuntimeException('Gagal membaca berkas PDF.');
        }

        $encryptionKey = config('app.key');

        if (is_string($encryptionKey) && str_starts_with($encryptionKey, 'base64:')) {
            $encryptionKey = base64_decode(substr($encryptionKey, 7), true);
        }

        if (! is_string($encryptionKey) || $encryptionKey === '') {
            throw new \RuntimeException('Kunci enkripsi aplikasi tidak valid.');
        }

        $decodedPayload = base64_decode($payload, true);

        if ($decodedPayload === false) {
            throw new \RuntimeException('Gagal mendekripsi berkas PDF.');
        }

        $ivLength = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($decodedPayload, 0, $ivLength);
        $encryptedContent = substr($decodedPayload, $ivLength);

        $decryptedContent = openssl_decrypt($encryptedContent, 'aes-256-cbc', $encryptionKey, 0, $iv);

        if ($decryptedContent === false) {
            throw new \RuntimeException('Gagal mendekripsi berkas PDF.');
        }

        return $decryptedContent;
    }

    /**
     * Enkripsi file dengan AES-256-CBC lalu simpan di disk privat.
     */
    private function encryptAndStore(UploadedFile $file): EncryptedFileData
    {
        $realPath = $file->getRealPath();

        if (! is_string($realPath) || $realPath === '') {
            throw new \RuntimeException('File tidak dapat dibaca.');
        }

        $content = file_get_contents($realPath);

        if ($content === false) {
            throw new \RuntimeException('File tidak dapat dibaca.');
        }

        $encryptionKey = config('app.key');

        if (! is_string($encryptionKey) || $encryptionKey === '') {
            throw new \RuntimeException('Kunci enkripsi aplikasi tidak valid.');
        }

        if (str_starts_with($encryptionKey, 'base64:')) {
            $encryptionKey = base64_decode(substr($encryptionKey, 7), true);
        }

        if ($encryptionKey === false || $encryptionKey === '') {
            throw new \RuntimeException('Kunci enkripsi aplikasi tidak valid.');
        }

        $ivLength = openssl_cipher_iv_length('aes-256-cbc');

        if ($ivLength === false) {
            throw new \RuntimeException('Konfigurasi enkripsi tidak valid.');
        }

        $iv = random_bytes($ivLength);
        $encrypted = openssl_encrypt(
            $content,
            'aes-256-cbc',
            $encryptionKey,
            0,
            $iv
        );

        if ($encrypted === false) {
            throw new \RuntimeException('Enkripsi file gagal.');
        }

        $path = 'documents/contracts/'.bin2hex(random_bytes(16)).'.enc';

        if (! Storage::disk('private_encrypted')->put($path, base64_encode($iv.$encrypted))) {
            throw new \RuntimeException('File terenkripsi gagal disimpan.');
        }

        $hash = hash_file('sha256', $realPath);

        if ($hash === false) {
            Storage::disk('private_encrypted')->delete($path);

            throw new \RuntimeException('Hash SHA-256 gagal dihitung.');
        }

        return new EncryptedFileData(
            path: $path,
            originalName: $file->getClientOriginalName(),
            size: (int) $file->getSize(),
            hash: $hash,
            mimeType: (string) ($file->getMimeType() ?? 'application/octet-stream'),
        );
    }

    private function deleteStoredFile(?string $path): void
    {
        if ($path === null) {
            return;
        }

        $disk = Storage::disk('private_encrypted');

        if ($disk->exists($path)) {
            $disk->delete($path);
        }
    }

    private function determineStatus(
        mixed $startDate,
        mixed $expiryDate,
        ?string $currentStatus = null
    ): string {
        if (
            $currentStatus !== null
            && in_array(strtolower($currentStatus), ['expired', 'terminated', 'draft', 'active'], true)
        ) {
            return strtolower($currentStatus);
        }

        $today = Carbon::today();
        $start = $startDate ? Carbon::parse($startDate)->startOfDay() : null;
        $expiry = $expiryDate ? Carbon::parse($expiryDate)->startOfDay() : null;

        if ($start && $start->greaterThan($today)) {
            return 'draft';
        }

        if ($expiry && $expiry->lessThan($today)) {
            return 'expired';
        }

        return 'active';
    }
}
