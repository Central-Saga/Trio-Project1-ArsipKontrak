<?php

namespace App\Repositories\Contracts;

use App\DTO\ActivityLogListQueryData;
use App\Models\ActivityLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ActivityLogRepositoryInterface
{
    public function paginate(ActivityLogListQueryData $query): LengthAwarePaginator;

    public function create(array $attributes): ActivityLog;
}
