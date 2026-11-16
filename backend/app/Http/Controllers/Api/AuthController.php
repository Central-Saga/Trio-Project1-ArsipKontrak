<?php

namespace App\Http\Controllers\Api;

use App\DTO\LoginData;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\LoginResource;
use App\Http\Resources\UserResource;
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
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Berhasil keluar (logout)',
        ]);
    }
}
