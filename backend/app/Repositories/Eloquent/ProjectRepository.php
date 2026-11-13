<?php

namespace App\Repositories\Eloquent;

use App\DTO\ProjectListQueryData;
use App\Models\Project;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ProjectRepository implements ProjectRepositoryInterface
{
    public function dropdown(ProjectListQueryData $query): Collection
    {
        $builder = Project::query()->select(['id', 'project_code', 'project_name']);

        if ($query->search !== null) {
            $builder->where(function ($inner) use ($query): void {
                $inner->where('project_code', 'like', "%{$query->search}%")
                    ->orWhere('project_name', 'like', "%{$query->search}%");
            });
        }

        return $builder
            ->orderBy($query->sort, $query->direction)
            ->limit($query->perPage)
            ->get();
    }
}
