<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'version_id' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function versionId(): ?string
    {
        $versionId = $this->validated('version_id');

        return is_string($versionId) && $versionId !== '' ? $versionId : null;
    }
}
