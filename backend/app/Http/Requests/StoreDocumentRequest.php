<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id'      => ['required', 'integer', 'exists:projects,id'],
            'document_number' => ['required', 'string', 'max:255', 'unique:documents,document_number'],
            'document_name'   => ['required', 'string', 'max:255'],
            'document_type'   => ['required', 'string', 'max:255'],
            'partner'         => ['required', 'string', 'max:255'],
            'document_date'   => ['required', 'date'],
            'effective_date'  => ['nullable', 'date'],
            'expiry_date'     => ['nullable', 'date', 'after_or_equal:effective_date'],
            'status'          => ['nullable', 'string', 'max:100'],
            'description'     => ['nullable', 'string'],
        ];
    }
}