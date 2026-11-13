<?php

namespace App\Http\Requests;

use App\DTO\DocumentVersionListQueryData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexDocumentVersionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sort' => ['nullable', Rule::in(DocumentVersionListQueryData::SORTABLE)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter' => ['nullable', 'array:sort,direction'],
            'filter.sort' => ['nullable', Rule::in(DocumentVersionListQueryData::SORTABLE)],
            'filter.direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ];
    }
}
