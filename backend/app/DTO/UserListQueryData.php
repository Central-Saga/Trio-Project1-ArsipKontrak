<?php

namespace App\DTO;

final readonly class UserListQueryData
{
    public const SORTABLE = [
        'name',
        'email',
        'role',
        'status',
        'created_at',
        'updated_at',
    ];

    public function __construct(
        public ?string $search,
        public ?string $role,
        public ?string $status,
        public string $sort = 'id',
        public string $direction = 'asc',
        public int $perPage = 50,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $filter = is_array($validated['filter'] ?? null) ? $validated['filter'] : [];

        return new self(
            search: self::stringOrNull($validated['search'] ?? $filter['search'] ?? null),
            role: self::stringOrNull($validated['role'] ?? $filter['role'] ?? null),
            status: self::stringOrNull($validated['status'] ?? $filter['status'] ?? null),
            sort: (string) ($validated['sort'] ?? 'id'),
            direction: (string) ($validated['direction'] ?? 'asc'),
            perPage: (int) ($validated['per_page'] ?? 50),
        );
    }

    private static function stringOrNull(mixed $value): ?string
    {
        return $value === null || $value === '' ? null : (string) $value;
    }
}
