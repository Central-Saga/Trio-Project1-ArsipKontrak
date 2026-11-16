<?php

namespace App\Repositories\Contracts;

use App\DTO\UserListQueryData;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface UserRepositoryInterface
{
    public function paginateForAdmin(UserListQueryData $query): LengthAwarePaginator;

    public function findByEmail(string $email): ?User;

    public function create(array $attributes): User;

    public function pluckIds(): Collection;

    public function lockActiveAdmins(): Collection;

    public function find(string $id): User;

    public function findForUpdate(string $id): User;

    public function delete(User $user): ?bool;

    public function transaction(Closure $callback): mixed;
}
