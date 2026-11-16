<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => ['required_without:new_password', 'nullable', 'string', 'min:8'],
            'new_password' => ['required_without:password', 'nullable', 'string', 'min:8'],
            'password_confirmation' => ['nullable', 'string'],
        ];
    }

    public function newPassword(): string
    {
        $validated = $this->validated();

        return (string) ($validated['password'] ?? $validated['new_password']);
    }
}
