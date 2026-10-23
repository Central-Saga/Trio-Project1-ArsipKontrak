<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function index()
    {
        Gate::authorize('viewAny', User::class);

        return UserResource::collection(
            User::query()->orderBy('id')->get()
        )->additional([
            'success' => true,
            'message' => 'Daftar pengguna berhasil diambil.',
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();
        $user = User::create($validated);

        ActivityLog::record(
            $request->user()->id,
            'TAMBAH_PENGGUNA',
            'Admin ' . $request->user()->name
                . ' berhasil menambahkan pengguna baru: '
                . $user->name . ' (' . $user->role . ')'
        );

        return (new UserResource($user))->additional([
            'success' => true,
            'message' => 'Pengguna berhasil ditambahkan.',
        ])->response()->setStatusCode(201);
    }

    public function destroy(string $id)
    {
        $actor = auth()->user();

        DB::transaction(function () use ($id, $actor): void {
            /*
             * Kunci semua admin aktif dalam urutan ID yang konsisten.
             * Ini menserialisasi penghapusan user agar dua request bersamaan
             * tidak dapat menghapus seluruh admin aktif.
             */
            $activeAdmins = User::query()
                ->where('role', 'admin')
                ->where('status', 'active')
                ->orderBy('id')
                ->lockForUpdate()
                ->get(['id']);

            // Ambil dan kunci target setelah lock admin aktif didapatkan.
            $target = User::query()
                ->lockForUpdate()
                ->findOrFail($id);

            // Policy menolak non-admin dan penghapusan akun sendiri.
            Gate::authorize('delete', $target);

            // Sistem harus selalu menyisakan minimal satu admin aktif.
            if (
                $target->role === 'admin'
                && $target->status === 'active'
                && $activeAdmins->count() <= 1
            ) {
                abort(
                    403,
                    'Tidak dapat menghapus admin aktif terakhir.'
                );
            }

            $userName = $target->name;

            $target->delete();

            // Catat audit di transaksi yang sama dengan penghapusan.
            ActivityLog::record(
                $actor->id,
                'HAPUS_PENGGUNA',
                'Admin ' . $actor->name . ' menghapus pengguna: ' . $userName
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus.',
            'data' => null,
        ]);
    }
}
