<?php

namespace App\Services;

use App\DTO\CreateDocumentData;
use App\DTO\CreateDocumentVersionData;
use App\DTO\EncryptedFileData;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\DocumentVersionRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentService
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private DocumentVersionRepositoryInterface $versions,
    ) {}

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
                    'status' => $data->status,
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
}
