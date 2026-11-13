<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class UserRepository implements UserRepositoryInterface
{
    public function paginate(int $perPage = 50): LengthAwarePaginator
    {
        return User::query()->orderBy('id')->paginate($perPage);
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
