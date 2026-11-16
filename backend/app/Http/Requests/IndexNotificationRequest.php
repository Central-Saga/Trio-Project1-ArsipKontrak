<?php

namespace App\Http\Requests;

use App\DTO\NotificationListQueryData;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', 'max:50'],
            'read' => ['nullable', Rule::in(['read', 'unread', 'true', 'false'])],
            'sort' => ['nullable', Rule::in(NotificationListQueryData::SORTABLE)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter' => ['nullable', 'array:type,read'],
            'filter.type' => ['nullable', 'string', 'max:50'],
            'filter.read' => ['nullable', Rule::in(['read', 'unread', 'true', 'false'])],
        ];
    }
}
