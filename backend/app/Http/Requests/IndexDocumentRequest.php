<?php

namespace App\Http\Requests;

use App\DTO\DocumentListQueryData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexDocumentRequest extends FormRequest
{
    private const DOCUMENT_TYPES = [
        'contract',
        'mou',
        'adendum',
        'addendum',
        'agreement',
        'supporting',
        'other',
    ];

    private const STATUSES = [
        'draft',
        'active',
        'expired',
        'terminated',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(self::STATUSES)],
            'document_type' => ['nullable', Rule::in(self::DOCUMENT_TYPES)],
            'sort' => ['nullable', Rule::in(DocumentListQueryData::SORTABLE)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter' => ['nullable', 'array:search,status,document_type'],
            'filter.search' => ['nullable', 'string', 'max:100'],
            'filter.status' => ['nullable', Rule::in(self::STATUSES)],
            'filter.document_type' => ['nullable', Rule::in(self::DOCUMENT_TYPES)],
        ];
    }
}
