<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentRequest extends FormRequest
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

        // Biarkan controller mengembalikan 404 bila ID tidak ditemukan.
        if ($routeDocument === null || ! $this->routeDocument()) {
            return true;
        }

        return $this->user()?->can('update', $this->routeDocument()) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $aliases = [
            'document_number' => ['document_no', 'number'],
            'document_name' => ['title', 'name'],
            'document_type' => ['type'],
            'partner' => ['partner_name', 'counterpart_name', 'counterpart'],
            'document_date' => ['effective_date', 'start_date', 'date', 'tanggal'],
            'expiry_date' => ['end_date', 'expired_date'],
        ];

        $normalized = [];

        foreach ($aliases as $field => $alternatives) {
            if ($this->input($field) !== null && $this->input($field) !== '') {
                continue;
            }

            foreach ($alternatives as $alternative) {
                if ($this->input($alternative) !== null) {
                    $normalized[$field] = $this->input($alternative);
                    break;
                }
            }
        }

        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }

    public function rules(): array
    {
        $routeDocument = $this->route('document');
        $document = $this->routeDocument();
        $documentId = $document?->getKey()
            ?? ($routeDocument instanceof Document ? $routeDocument->getKey() : $routeDocument);

        return [
            'project_id' => ['sometimes', 'required', 'integer', 'exists:projects,id'],
            'document_number' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('documents', 'document_number')->ignore($documentId),
            ],
            'document_name' => ['sometimes', 'required', 'string', 'max:255'],
            'document_type' => [
                'sometimes',
                'required',
                Rule::in([
                    'contract', 'mou', 'adendum', 'addendum',
                    'agreement', 'supporting', 'other',
                ]),
            ],
            'partner' => ['sometimes', 'required', 'string', 'max:255'],
            'document_date' => ['sometimes', 'required', 'date'],
            'effective_date' => ['sometimes', 'nullable', 'date'],
            'expiry_date' => ['sometimes', 'required', 'date'],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['draft', 'active', 'expired', 'terminated']),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'document_number.unique' => 'Nomor dokumen sudah terdaftar.',
            'document_name.required' => 'Nama dokumen wajib diisi.',
            'document_type.in' => 'Jenis dokumen tidak valid.',
        ];
    }
}
