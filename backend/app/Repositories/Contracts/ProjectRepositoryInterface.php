<?php

namespace App\Repositories\Contracts;

use App\DTO\ProjectListQueryData;
use Illuminate\Database\Eloquent\Collection;

interface ProjectRepositoryInterface
{
    public function dropdown(ProjectListQueryData $query): Collection;
}
