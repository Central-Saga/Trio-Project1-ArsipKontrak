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
            'document_number' => ['required', 'string', 'max:100', 'unique:documents,document_number'],
            'document_name'   => ['required', 'string', 'max:200'],
            'document_type'   => ['required', 'string', 'in:contract,mou,adendum,agreement,supporting'],
            'partner'         => ['required', 'string', 'max:150'],
            'document_date'   => ['required', 'date'],
            'effective_date'  => ['required', 'date'],
            'expiry_date'     => ['required', 'date', 'after_or_equal:effective_date'],
            'status'          => ['nullable', 'string', 'in:draft,active,expired,terminated'],
            'description'     => ['nullable', 'string'],
            'file'            => ['required', 'file', 'mimes:pdf', 'max:20480'], // PDF max 20MB
            'notes'           => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'project_id.required'    => 'ID project wajib disertakan.',
            'document_number.unique' => 'Nomor dokumen sudah terdaftar di sistem.',
            'document_type.in'       => 'Tipe dokumen harus salah satu dari: contract, mou, adendum, agreement, supporting.',
            'status.in'              => 'Status dokumen harus salah satu dari: draft, active, expired, terminated.',
            'file.required'          => 'Berkas fisik kontrak wajib diunggah.',
            'file.mimes'             => 'Format berkas arsip harus bertipe PDF.',
            'file.max'               => 'Ukuran berkas PDF maksimal 20 MB.',
            'effective_date.required'=> 'Tanggal efektif kontrak wajib diisi.',
            'expiry_date.required'   => 'Tanggal berakhir kontrak wajib diisi.',
            'expiry_date.after_or_equal' => 'Tanggal berakhir tidak boleh sebelum tanggal efektif.',
        ];
    }
}