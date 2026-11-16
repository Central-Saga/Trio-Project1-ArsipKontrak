<?php

namespace App\Services;

use App\DTO\LoginData;
use App\DTO\LoginResultData;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private UserRepositoryInterface $users,
        private ActivityLogService $activityLogs,
    ) {}

    public function login(LoginData $data): LoginResultData
    {
        $user = $this->users->findByEmail($data->email);

        if (! $user || ! Hash::check($data->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan tidak cocok dengan data kami.'],
            ]);
        }

        $this->activityLogs->record(
            $user,
            'LOGIN',
            "Pengguna {$user->name} ({$user->role}) berhasil masuk ke sistem."
        );

        return new LoginResultData(
            user: $user,
            token: $user->createToken('auth_token')->plainTextToken,
        );
    }

    public function profile(User $user): User
    {
        return $user;
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();
        if ($token) {
            $token->delete();
        } else {
            $user->tokens()->delete();
        }
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini tidak sesuai.'],
            ]);
        }

        $user->password = Hash::make($newPassword);
        $user->save();

        // Cabut seluruh token agar seluruh sesi/token lama mati
        $user->tokens()->delete();

        $this->activityLogs->record(
            $user,
            'PASSWORD_CHANGE',
            "Pengguna {$user->name} berhasil mengubah password akun."
        );
    }
}
