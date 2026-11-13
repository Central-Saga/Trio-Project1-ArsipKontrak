<?php

namespace App\DTO;

final readonly class LoginData
{
    public function __construct(
        public string $email,
        public string $password,
    ) {}
}
