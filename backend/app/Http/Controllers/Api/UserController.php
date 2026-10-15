<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
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
        $target = User::findOrFail($id);
        Gate::authorize('delete', $target);

        if ((int) $target->id === (int) auth()->id()) {
            abort(403, 'Tidak dapat menghapus akun yang sedang digunakan sendiri.');
        }

        $userName = $target->name;
        $actor = auth()->user();

        $target->delete();

        ActivityLog::record(
            $actor->id,
            'HAPUS_PENGGUNA',
            'Admin ' . $actor->name . ' menghapus pengguna: ' . $userName
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus.',
            'data' => null,
        ]);
    }
}
