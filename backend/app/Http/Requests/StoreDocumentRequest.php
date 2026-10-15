<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Jalankan validasi terlebih dahulu agar request tidak valid
        // tetap mendapatkan respons 422. Izin diperiksa di controller.
        return true;
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
            'notes' => ['description'],
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

        if (! $this->hasFile('file') && $this->hasFile('document_file')) {
            $this->files->set('file', $this->file('document_file'));
        }

        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }

    public function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'document_number' => [
                'required',
                'string',
                'max:100',
                Rule::unique('documents', 'document_number'),
            ],
            'document_name' => ['required', 'string', 'max:255'],
            'document_type' => [
                'required',
                Rule::in([
                    'contract', 'mou', 'adendum', 'addendum',
                    'agreement', 'supporting', 'other',
                ]),
            ],
            'partner' => ['required', 'string', 'max:255'],
            'document_date' => ['required', 'date'],
            'effective_date' => ['nullable', 'date'],
            'expiry_date' => [
                'required',
                'date',
                'after_or_equal:document_date',
            ],
            'status' => [
                'nullable',
                Rule::in(['draft', 'active', 'expired', 'terminated']),
            ],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:20480'],
        ];
    }

    public function messages(): array
    {
        return [
            'project_id.required' => 'Proyek wajib dipilih.',
            'project_id.exists' => 'Proyek yang dipilih tidak valid.',
            'document_number.required' => 'Nomor dokumen wajib diisi.',
            'document_number.unique' => 'Nomor dokumen sudah terdaftar.',
            'document_name.required' => 'Nama dokumen wajib diisi.',
            'document_type.in' => 'Jenis dokumen tidak valid.',
            'partner.required' => 'Pihak mitra wajib diisi.',
            'document_date.required' => 'Tanggal dokumen wajib diisi.',
            'expiry_date.required' => 'Tanggal kedaluwarsa wajib diisi.',
            'expiry_date.after_or_equal' =>
                'Tanggal kedaluwarsa harus sama atau setelah tanggal dokumen.',
            'file.required' => 'Berkas PDF dokumen wajib diunggah.',
            'file.mimes' => 'Berkas dokumen harus berupa PDF.',
            'file.max' => 'Ukuran berkas PDF maksimal 20 MB.',
        ];
    }
}
