<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule; // <-- 1. Tambahkan import Rule

class StoreDocumentVersionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Mendapatkan ID dokumen dari parameter route (misal: /api/v1/documents/{document}/versions)
        $document = $this->route('document');
        $documentId = $document ? $document->id : null;

        return [
            // 2. Beri validasi unik bersyarat per document_id jika diisi
            'version_number' => [
                'nullable', 
                'string', 
                'max:20',
                Rule::unique('document_versions', 'version_number')->where(function ($query) use ($documentId) {
                    return $query->where('document_id', $documentId);
                }),
            ],
            'file'           => ['required', 'file', 'mimes:pdf', 'max:20480'], // Wajib PDF, max 20MB
            'notes'          => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'version_number.unique' => 'Nomor versi ini sudah ada untuk dokumen tersebut.',
            'file.required'         => 'File revisi kontrak wajib diunggah.',
            'file.mimes'            => 'File revisi harus berupa dokumen PDF.',
            'file.max'              => 'Ukuran file revisi maksimal 20 MB.',
        ];
    }
}