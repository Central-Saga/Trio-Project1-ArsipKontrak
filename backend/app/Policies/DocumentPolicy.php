<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array(
            $user->role,
            ['admin', 'project_manager', 'document_controller', 'viewer'],
            true
        );
    }

    public function view(User $user, Document $document): bool
    {
        $isConfidential = str_contains(strtolower($document->document_name), 'nda')
            || str_contains(strtolower($document->document_name), 'rahasia')
            || str_contains(strtolower($document->description ?? ''), 'nda')
            || str_contains(strtolower($document->description ?? ''), 'rahasia');

        return ! $isConfidential || $user->role === 'admin';
    }

    public function create(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function update(User $user, Document $document): bool
    {
        return $user->role === 'admin';
    }

    public function download(User $user, Document $document): bool
    {
        return $user->role === 'admin';
    }

    public function delete(User $user, Document $document): bool
    {
        return $user->role === 'admin';
    }

    public function viewTrash(User $user): bool
    {
        return $user->role === 'admin';
    }

    public function restore(User $user, Document $document): bool
    {
        return $user->role === 'admin';
    }
}
