<?php

namespace App\Http\Controllers\Api;

use App\DTO\LoginData;
use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\LoginResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService) {}

    public function login(LoginRequest $request)
    {
        $validated = $request->validated();

        $result = $this->authService->login(
            new LoginData(
                email: (string) $validated['email'],
                password: (string) $validated['password'],
            )
        );

        return response()->json(
            (new LoginResource($result))->resolve($request)
        );
    }

    public function me(Request $request)
    {
        $user = $this->authService->profile($request->user());

        return response()->json(
            (new UserResource($user))->resolve($request)
        );
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $this->authService->logout($user);
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar (logout)',
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        /** @var User $user */
        $user = $request->user();

        $this->authService->changePassword(
            $user,
            (string) $request->validated('current_password'),
            $request->newPassword()
        );

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah. Semua sesi dan token lama telah dicabut.',
            'data' => null,
        ]);
    }
}
