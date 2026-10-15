<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentVersionRequest extends FormRequest
{
    private function routeDocument(): ?Document
    {
        $routeDocument = $this->route('document');

        if ($routeDocument instanceof Document) {
            return $routeDocument;
        }

        if (is_numeric($routeDocument)) {
            return Document::find((int) $routeDocument);
        }

        return null;
    }

    public function authorize(): bool
    {
        $routeDocument = $this->route('document');

        // Biarkan controller mengembalikan 404 untuk ID dokumen yang tidak ada.
        if ($routeDocument === null || ! $this->routeDocument()) {
            return true;
        }

        return $this->user()?->can('update', $this->routeDocument()) ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('notes') === null && $this->input('description') !== null) {
            $this->merge([
                'notes' => $this->input('description'),
            ]);
        }
    }

    public function rules(): array
    {
        $routeDocument = $this->route('document');
        $document = $this->routeDocument();
        $documentId = $document?->getKey()
            ?? ($routeDocument instanceof Document ? $routeDocument->getKey() : $routeDocument);

        return [
            'version_number' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('document_versions', 'version_number')
                    ->where(fn ($query) => $query->where('document_id', $documentId)),
            ],
            'file' => ['required', 'file', 'mimes:pdf', 'max:20480'],
            'notes' => ['required', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'version_number.unique' => 'Nomor versi sudah digunakan untuk dokumen ini.',
            'file.required' => 'File revisi kontrak wajib diunggah.',
            'file.mimes' => 'File revisi harus berupa PDF.',
            'file.max' => 'Ukuran file revisi maksimal 20 MB.',
            'notes.required' => 'Changelog atau catatan revisi wajib diisi.',
        ];
    }
}
