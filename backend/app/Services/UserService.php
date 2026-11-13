<?php

namespace App\Services;

use App\DTO\CreateUserData;
use App\DTO\UserListQueryData;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserService
{
    public function __construct(
        private UserRepositoryInterface $users,
        private ActivityLogService $activityLogs,
    ) {}

    public function listUsers(UserListQueryData $query): LengthAwarePaginator
    {
        return $this->users->paginateForAdmin($query);
    }

    public function find(string $id): User
    {
        return $this->users->find($id);
    }

    public function create(CreateUserData $data, User $actor): User
    {
        $user = $this->users->create($data->toAttributes());

        $this->activityLogs->record(
            $actor,
            'TAMBAH_PENGGUNA',
            "Admin {$actor->name} berhasil menambahkan pengguna baru: {$user->name} ({$user->role})"
        );

        return $user;
    }

    public function delete(string $id, User $actor): void
    {
        $this->users->transaction(function () use ($id, $actor): void {
            /*
             * Kunci semua admin aktif dalam urutan ID yang konsisten.
             * Ini menserialisasi penghapusan user agar dua request bersamaan
             * tidak dapat menghapus seluruh admin aktif.
             */
            $activeAdmins = $this->users->lockActiveAdmins();

            $target = $this->users->findForUpdate($id);

            if (
                $target->role === 'admin'
                && $target->status === 'active'
                && $activeAdmins->count() <= 1
            ) {
                abort(403, 'Tidak dapat menghapus admin aktif terakhir.');
            }

            $userName = $target->name;

            $this->users->delete($target);

            $this->activityLogs->record(
                $actor,
                'HAPUS_PENGGUNA',
                'Admin '.$actor->name.' menghapus pengguna: '.$userName
            );
        });
    }
}
