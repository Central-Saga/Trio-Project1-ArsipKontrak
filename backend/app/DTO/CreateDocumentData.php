<?php

namespace App\DTO;

/**
 * Data yang dibutuhkan untuk membuat dokumen beserta versi pertamanya.
 *
 * Service tidak lagi menerima array mentah supaya kontrak antar-layer
 * eksplisit dan mudah diuji.
 */
final readonly class CreateDocumentData
{
    public function __construct(
        public int $projectId,
        public string $documentNumber,
        public string $documentName,
        public string $documentType,
        public string $partner,
        public string $documentDate,
        public string $effectiveDate,
        public string $expiryDate,
        public ?string $status = null,
        public ?string $description = null,
        public string $versionNumber = 'v1.0',
        public string $notes = 'Dokumen awal diunggah.',
    ) {}

    /**
     * Bangun DTO dari data hasil validasi FormRequest.
     *
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        return new self(
            projectId: (int) $validated['project_id'],
            documentNumber: (string) $validated['document_number'],
            documentName: (string) $validated['document_name'],
            documentType: (string) $validated['document_type'],
            partner: (string) $validated['partner'],
            documentDate: (string) $validated['document_date'],
            effectiveDate: (string) ($validated['effective_date'] ?? $validated['document_date']),
            expiryDate: (string) $validated['expiry_date'],
            status: isset($validated['status']) ? (string) $validated['status'] : null,
            description: isset($validated['description']) ? (string) $validated['description'] : null,
            versionNumber: (string) ($validated['version_number'] ?? 'v1.0'),
            notes: (string) ($validated['notes'] ?? 'Dokumen awal diunggah.'),
        );
    }
}
