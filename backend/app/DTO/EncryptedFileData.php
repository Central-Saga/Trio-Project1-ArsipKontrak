<?php

namespace App\DTO;

/**
 * Metadata file yang sudah dienkripsi dan disimpan di disk privat.
 */
final readonly class EncryptedFileData
{
    public function __construct(
        public string $path,
        public string $originalName,
        public int $size,
        public string $hash,
        public string $mimeType,
    ) {}
}
