<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class DocumentService
{
    protected function encryptAndStore(UploadedFile $file): array
    {
        $originalName = $file->getClientOriginalName();
        $fileContent = file_get_contents($file->getRealPath());

        $encryptionKey = config('app.key');
        if (str_starts_with($encryptionKey, 'base64:')) {
            $encryptionKey = base64_decode(substr($encryptionKey, 7));
        }

        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
        $encryptedContent = openssl_encrypt($fileContent, 'aes-256-cbc', $encryptionKey, 0, $iv);
        $payload = base64_encode($iv . $encryptedContent);

        $path = 'documents/contracts/' . uniqid() . '.enc';
        Storage::disk('private_encrypted')->put($path, $payload);

        $fileHash = hash_file('sha256', $file->getRealPath());

        return [
            'file_path' => $path,
            'file_name' => $originalName,
            'file_size' => $file->getSize(),
            'file_hash' => $fileHash,
            'mime_type' => $file->getMimeType(),
        ];
    }

    public function createDocument(array $validatedData, UploadedFile $file, int $userId): Document
    {
        return DB::transaction(function () use ($validatedData, $file, $userId) {
            $document = Document::create([
                'document_number' => $validatedData['document_number'],
                'document_name'   => $validatedData['document_name'],
                'document_type'   => $validatedData['document_type'],
                'partner'         => $validatedData['partner'],
                'document_date'   => $validatedData['document_date'],
                'effective_date'  => $validatedData['effective_date'],
                'expiry_date'     => $validatedData['expiry_date'],
                'status'          => $validatedData['status'],
                'description'     => $validatedData['description'] ?? null,
                'project_id'      => $validatedData['project_id'] ?? null,
                'created_by'      => $userId,
            ]);

            $fileData = $this->encryptAndStore($file);

            DocumentVersion::create([
                'document_id'    => $document->id,
                'version_number' => $validatedData['version_number'] ?? 'v1.0',
                'file_path'      => $fileData['file_path'],
                'file_name'      => $fileData['file_name'],
                'file_size'      => $fileData['file_size'],
                'file_hash'      => $fileData['file_hash'],
                'mime_type'      => $fileData['mime_type'],
                'notes'          => $validatedData['notes'] ?? 'Dokumen awal diunggah.',
                'uploaded_by'    => $userId,
            ]);

            return $document;
        });
    }

    public function addVersion(Document $document, array $validatedData, UploadedFile $file, int $userId): DocumentVersion
    {
        $fileData = $this->encryptAndStore($file);

        return DocumentVersion::create([
            'document_id'    => $document->id,
            'version_number' => $validatedData['version_number'],
            'file_path'      => $fileData['file_path'],
            'file_name'      => $fileData['file_name'],
            'file_size'      => $fileData['file_size'],
            'file_hash'      => $fileData['file_hash'],
            'mime_type'      => $fileData['mime_type'],
            'notes'          => $validatedData['notes'] ?? null,
            'uploaded_by'    => $userId,
        ]);
    }
}