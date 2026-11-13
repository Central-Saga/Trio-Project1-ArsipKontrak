<?php

namespace App\DTO;

final readonly class DocumentVersionListQueryData
{
    public const SORTABLE = [
        'version_number',
        'created_at',
        'updated_at',
    ];

    public function __construct(
        public string $sort = 'created_at',
        public string $direction = 'desc',
        public int $perPage = 100,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $filter = is_array($validated['filter'] ?? null) ? $validated['filter'] : [];

        return new self(
            sort: (string) ($validated['sort'] ?? $filter['sort'] ?? 'created_at'),
            direction: (string) ($validated['direction'] ?? $filter['direction'] ?? 'desc'),
            perPage: (int) ($validated['per_page'] ?? 100),
        );
    }
}
