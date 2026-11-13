<?php

namespace App\Http\Controllers\Api;

use App\DTO\CreateUserData;
use App\DTO\UserListQueryData;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexUserRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    public function index(IndexUserRequest $request)
    {
        Gate::authorize('viewAny', User::class);

        return UserResource::collection(
            $this->userService->listUsers(
                UserListQueryData::fromValidated($request->validated())
            )
        )->additional([
            'success' => true,
            'message' => 'Daftar pengguna berhasil diambil.',
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        Gate::authorize('create', User::class);

        $user = $this->userService->create(
            CreateUserData::fromValidated($request->validated()),
            $request->user()
        );

        return (new UserResource($user))->additional([
            'success' => true,
            'message' => 'Pengguna berhasil ditambahkan.',
        ])->response()->setStatusCode(201);
    }

    public function destroy(string $id)
    {
        $actor = auth()->user();
        $target = $this->userService->find($id);

        Gate::authorize('delete', $target);

        $this->userService->delete($id, $actor);

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus.',
            'data' => null,
        ]);
    }
}
