<?php

namespace App\DTO;

final readonly class DocumentListQueryData
{
    public const SORTABLE = [
        'document_number',
        'document_name',
        'document_type',
        'partner',
        'document_date',
        'effective_date',
        'expiry_date',
        'status',
        'created_at',
        'updated_at',
    ];

    public function __construct(
        public ?string $search,
        public ?string $status,
        public ?string $documentType,
        public string $sort = 'created_at',
        public string $direction = 'desc',
        public int $perPage = 15,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $filter = is_array($validated['filter'] ?? null) ? $validated['filter'] : [];

        return new self(
            search: self::stringOrNull($validated['search'] ?? $filter['search'] ?? null),
            status: self::stringOrNull($validated['status'] ?? $filter['status'] ?? null),
            documentType: self::stringOrNull(
                $validated['document_type'] ?? $filter['document_type'] ?? null
            ),
            sort: (string) ($validated['sort'] ?? 'created_at'),
            direction: (string) ($validated['direction'] ?? 'desc'),
            perPage: (int) ($validated['per_page'] ?? 15),
        );
    }

    private static function stringOrNull(mixed $value): ?string
    {
        return $value === null || $value === '' ? null : (string) $value;
    }
}
