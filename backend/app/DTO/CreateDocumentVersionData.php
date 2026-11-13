<?php

namespace App\DTO;

/**
 * Data yang dibutuhkan untuk menambahkan versi baru pada dokumen.
 */
final readonly class CreateDocumentVersionData
{
    public function __construct(
        public ?string $versionNumber,
        public string $notes,
    ) {}

    /**
     * Bangun DTO dari data hasil validasi FormRequest.
     *
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $versionNumber = $validated['version_number'] ?? null;

        return new self(
            versionNumber: $versionNumber !== null ? (string) $versionNumber : null,
            notes: (string) $validated['notes'],
        );
    }
}
