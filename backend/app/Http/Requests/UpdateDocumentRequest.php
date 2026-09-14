<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $document = $this->route('document');
        $documentId = $document ? $document->id : null;

        return [
            'project_id'      => ['sometimes', 'required', 'integer', 'exists:projects,id'],
            'document_number' => ['sometimes', 'required', 'string', 'max:255', 'unique:documents,document_number,' . $documentId],
            'document_name'   => ['sometimes', 'required', 'string', 'max:255'],
            'document_type'   => ['sometimes', 'required', 'string', 'max:255'],
            'partner'         => ['sometimes', 'required', 'string', 'max:255'],
            'document_date'   => ['sometimes', 'required', 'date'],
            'effective_date'  => ['nullable', 'date'],
            'expiry_date'     => ['nullable', 'date', 'after_or_equal:effective_date'],
            'status'          => ['nullable', 'string', 'max:100'],
            'description'     => ['nullable', 'string'],
        ];
    }
}