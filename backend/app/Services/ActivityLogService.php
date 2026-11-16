<?php

namespace App\Services;

use App\DTO\ActivityLogListQueryData;
use App\Models\ActivityLog;
use App\Models\User;
use App\Repositories\Contracts\ActivityLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ActivityLogService
{
    public function __construct(private ActivityLogRepositoryInterface $logs) {}

    public function listLogs(ActivityLogListQueryData $query): LengthAwarePaginator
    {
        return $this->logs->paginate($query);
    }

    public function record(
        User $user,
        string $action,
        ?string $description = null,
        ?int $documentId = null
    ): ActivityLog {
        return $this->logs->create([
            'user_id' => $user->id,
            'document_id' => $documentId,
            'action' => $action,
            'description' => $description,
            'ip_address' => request()->ip(),
        ]);
    }
}
