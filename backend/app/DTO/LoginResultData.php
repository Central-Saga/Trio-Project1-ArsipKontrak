<?php

namespace App\DTO;

use App\Models\User;

final readonly class LoginResultData
{
    public function __construct(
        public User $user,
        public string $token,
    ) {}
}
