<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentVersionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'version_number' => ['nullable', 'string', 'max:20'],
            'file'           => ['required', 'file', 'mimes:pdf', 'max:20480'], // Wajib PDF, max 20MB
            'notes'          => ['nullable', 'string', 'max:500'],
            'secure_mode'    => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'File revisi kontrak wajib diunggah.',
            'file.mimes'    => 'File revisi harus berupa dokumen PDF.',
            'file.max'      => 'Ukuran file revisi maksimal 20 MB.',
        ];
    }
}