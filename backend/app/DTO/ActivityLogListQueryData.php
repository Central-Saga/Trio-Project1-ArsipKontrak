<?php

namespace App\DTO;

final readonly class ActivityLogListQueryData
{
    public const SORTABLE = [
        'action',
        'created_at',
    ];

    public function __construct(
        public ?string $action,
        public ?int $userId,
        public ?int $documentId,
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
            action: self::stringOrNull($validated['action'] ?? $filter['action'] ?? null),
            userId: self::intOrNull($validated['user_id'] ?? $filter['user_id'] ?? null),
            documentId: self::intOrNull($validated['document_id'] ?? $filter['document_id'] ?? null),
            sort: (string) ($validated['sort'] ?? 'created_at'),
            direction: (string) ($validated['direction'] ?? 'desc'),
            perPage: (int) ($validated['per_page'] ?? 15),
        );
    }

    private static function stringOrNull(mixed $value): ?string
    {
        return $value === null || $value === '' ? null : (string) $value;
    }

    private static function intOrNull(mixed $value): ?int
    {
        return $value === null || $value === '' ? null : (int) $value;
    }
}
