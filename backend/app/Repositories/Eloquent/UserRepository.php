<?php

namespace App\Repositories\Eloquent;

use App\DTO\UserListQueryData;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class UserRepository implements UserRepositoryInterface
{
    public function paginateForAdmin(UserListQueryData $query): LengthAwarePaginator
    {
        $builder = User::query();

        if ($query->search !== null) {
            $builder->where(function ($inner) use ($query): void {
                $inner->where('name', 'like', "%{$query->search}%")
                    ->orWhere('email', 'like', "%{$query->search}%");
            });
        }

        if ($query->role !== null) {
            $builder->where('role', $query->role);
        }

        if ($query->status !== null) {
            $builder->where('status', $query->status);
        }

        return $builder
            ->orderBy($query->sort, $query->direction)
            ->paginate($query->perPage);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function create(array $attributes): User
    {
        return User::create($attributes);
    }

    public function pluckIds(): Collection
    {
        return User::query()->pluck('id');
    }

    public function lockActiveAdmins(): Collection
    {
        return User::query()
            ->where('role', 'admin')
            ->where('status', 'active')
            ->orderBy('id')
            ->lockForUpdate()
            ->pluck('id');
    }

    public function find(string $id): User
    {
        return User::query()->findOrFail($id);
    }

    public function findForUpdate(string $id): User
    {
        return User::query()
            ->lockForUpdate()
            ->findOrFail($id);
    }

    public function delete(User $user): ?bool
    {
        return $user->delete();
    }

    public function transaction(Closure $callback): mixed
    {
        return DB::transaction($callback);
    }
}
