<?php

namespace App\Http\Requests;

use App\DTO\ActivityLogListQueryData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexActivityLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => ['nullable', 'string', 'max:50'],
            'user_id' => ['nullable', 'integer', 'min:1'],
            'document_id' => ['nullable', 'integer', 'min:1'],
            'sort' => ['nullable', Rule::in(ActivityLogListQueryData::SORTABLE)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter' => ['nullable', 'array:action,user_id,document_id'],
            'filter.action' => ['nullable', 'string', 'max:50'],
            'filter.user_id' => ['nullable', 'integer', 'min:1'],
            'filter.document_id' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
