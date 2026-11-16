<?php

namespace App\DTO;

final readonly class NotificationListQueryData
{
    public const SORTABLE = [
        'type',
        'sent_at',
        'read_at',
        'created_at',
    ];

    public function __construct(
        public ?string $type,
        public ?bool $unreadOnly,
        public string $sort = 'created_at',
        public string $direction = 'desc',
        public int $perPage = 50,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        $filter = is_array($validated['filter'] ?? null) ? $validated['filter'] : [];
        $read = $validated['read'] ?? $filter['read'] ?? null;

        return new self(
            type: self::stringOrNull($validated['type'] ?? $filter['type'] ?? null),
            unreadOnly: $read === 'unread' || $read === 'false' || $read === false,
            sort: (string) ($validated['sort'] ?? 'created_at'),
            direction: (string) ($validated['direction'] ?? 'desc'),
            perPage: (int) ($validated['per_page'] ?? 50),
        );
    }

    private static function stringOrNull(mixed $value): ?string
    {
        return $value === null || $value === '' ? null : (string) $value;
    }
}
