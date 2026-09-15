<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Menentukan apakah user dapat melihat daftar dokumen.
     */
    public function viewAny(User $user): bool
    {
        // Admin dan Viewer boleh melihat daftar arsip
        return true; 
    }

    /**
     * Menentukan apakah user dapat melihat detail dokumen tertentu.
     */
    public function view(User $user, Document $document): bool
    {
        // Cek apakah dokumen dikategorikan Rahasia / NDA
        $isConfidential = str_contains(strtolower($document->document_name), 'nda') || 
                          str_contains(strtolower($document->document_name), 'rahasia') ||
                          str_contains(strtolower($document->description ?? ''), 'nda') ||
                          str_contains(strtolower($document->description ?? ''), 'rahasia');

        if ($isConfidential) {
            // Dokumen NDA/Rahasia hanya boleh dilihat oleh admin
            return $user->role === 'admin';
        }

        // Dokumen biasa boleh dilihat oleh admin dan user lainnya
        return true; 
    }

    /**
     * Menentukan apakah user dapat mengunggah dokumen baru.
     */
    public function create(User $user): bool
    {
        // Hanya admin yang diizinkan mengunggah dokumen baru
        return $user->role === 'admin';
    }

    /**
     * Menentukan apakah user dapat memperbarui dokumen atau menambah versi/adendum.
     */
    public function update(User $user, Document $document): bool
    {
        // Hanya admin yang bisa mengedit atau menambah adendum/versi
        return $user->role === 'admin';
    }

    /**
     * Menentukan apakah user dapat menghapus dokumen.
     */
    public function delete(User $user, Document $document): bool
    {
        // Hanya admin yang berhak menghapus arsip dokumen
        return $user->role === 'admin';
    }
}