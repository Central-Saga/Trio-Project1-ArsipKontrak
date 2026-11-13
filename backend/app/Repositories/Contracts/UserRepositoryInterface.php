<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface UserRepositoryInterface
{
    public function paginate(int $perPage = 50): LengthAwarePaginator;

    public function findByEmail(string $email): ?User;

    public function create(array $attributes): User;

    public function pluckIds(): Collection;

    public function lockActiveAdmins(): Collection;

    public function findForUpdate(string $id): User;

    public function delete(User $user): ?bool;

    public function transaction(Closure $callback): mixed;
}
