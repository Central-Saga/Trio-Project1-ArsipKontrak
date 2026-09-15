<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule; // <-- 1. Tambahkan import Rule

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
        $currentProjectId = $document ? $document->project_id : null;

        return [
            'project_id'      => ['sometimes', 'required', 'integer', 'exists:projects,id'],
            
            // 2. Sesuaikan unique rule dengan project_id & ignore ID dokumen
            'document_number' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('documents', 'document_number')
                    ->where(function ($query) use ($currentProjectId) {
                        $projectId = $this->project_id ?? $currentProjectId;
                        return $query->where('project_id', $projectId);
                    })
                    ->ignore($documentId),
            ],
            
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