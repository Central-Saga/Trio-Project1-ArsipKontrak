<?php

namespace App\Repositories\Eloquent;

use App\DTO\ActivityLogListQueryData;
use App\Models\ActivityLog;
use App\Repositories\Contracts\ActivityLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ActivityLogRepository implements ActivityLogRepositoryInterface
{
    public function paginate(ActivityLogListQueryData $query): LengthAwarePaginator
    {
        $builder = ActivityLog::query()->with(['user', 'document']);

        if ($query->action !== null) {
            $builder->where('action', $query->action);
        }

        if ($query->userId !== null) {
            $builder->where('user_id', $query->userId);
        }

        if ($query->documentId !== null) {
            $builder->where('document_id', $query->documentId);
        }

        return $builder
            ->orderBy($query->sort, $query->direction)
            ->paginate($query->perPage);
    }

    public function create(array $attributes): ActivityLog
    {
        return ActivityLog::create($attributes);
    }
}
