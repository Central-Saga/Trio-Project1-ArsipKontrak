<?php

namespace App\DTO;

final readonly class ProjectListQueryData
{
    public const SORTABLE = [
        'project_code',
        'project_name',
        'created_at',
    ];

    public function __construct(
        public ?string $search,
        public string $sort = 'project_name',
        public string $direction = 'asc',
        public int $perPage = 100,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $filter = is_array($validated['filter'] ?? null) ? $validated['filter'] : [];
        $search = $validated['search'] ?? $filter['search'] ?? null;

        return new self(
            search: $search === null || $search === '' ? null : (string) $search,
            sort: (string) ($validated['sort'] ?? 'project_name'),
            direction: (string) ($validated['direction'] ?? 'asc'),
            perPage: (int) ($validated['per_page'] ?? 100),
        );
    }
}
