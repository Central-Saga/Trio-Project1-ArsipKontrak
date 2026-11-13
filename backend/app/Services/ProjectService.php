<?php

namespace App\Services;

use App\DTO\ProjectListQueryData;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ProjectService
{
    public function __construct(private ProjectRepositoryInterface $projects) {}

    public function dropdown(ProjectListQueryData $query): Collection
    {
        return $this->projects->dropdown($query);
    }
}
