<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'document_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('documents', 'document_number')->where(function ($query) {
                    return $query->where('project_id', $this->project_id);
                }),
            ],
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

    public function messages(): array
    {
        return [
            'project_id.required'        => 'Proyek wajib dipilih.',
            'project_id.exists'          => 'Proyek yang dipilih tidak valid.',
            'document_number.required'   => 'Nomor kontrak/dokumen wajib diisi.',
            'document_number.unique'     => 'Nomor kontrak ini sudah terdaftar di dalam proyek yang sama.',
            'document_name.required'     => 'Nama dokumen wajib diisi.',
            'document_type.required'     => 'Jenis dokumen wajib diisi.',
            'partner.required'           => 'Pihak mitra (partner) wajib diisi.',
            'document_date.required'     => 'Tanggal dokumen wajib diisi.',
            'expiry_date.after_or_equal' => 'Tanggal kedaluwarsa harus sama atau setelah tanggal mulai efektif.',
        ];
    }
}