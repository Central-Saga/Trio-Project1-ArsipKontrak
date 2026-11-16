<?php

namespace App\DTO;

final readonly class DocumentFileData
{
    public function __construct(
        public string $content,
        public string $fileName,
        public string $mimeType,
    ) {}
}
