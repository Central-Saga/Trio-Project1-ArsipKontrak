<?php

namespace App\Http\Requests;

use App\DTO\UserListQueryData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'role' => [
                'nullable',
                Rule::in(['admin', 'project_manager', 'document_controller', 'viewer']),
            ],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'sort' => ['nullable', Rule::in(UserListQueryData::SORTABLE)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter' => ['nullable', 'array:search,role,status'],
            'filter.search' => ['nullable', 'string', 'max:100'],
            'filter.role' => [
                'nullable',
                Rule::in(['admin', 'project_manager', 'document_controller', 'viewer']),
            ],
            'filter.status' => ['nullable', Rule::in(['active', 'inactive'])],
        ];
    }
}
