<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentVersionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'document_id'    => $this->document_id,
            'version_number' => $this->version_number,
            'file_name'      => $this->file_name,
            'file_hash'      => $this->file_hash,
            'file_size'      => $this->file_size,
            'mime_type'      => $this->mime_type,
            'is_current'     => (bool) $this->is_current,
            'notes'          => $this->notes,
            'uploaded_by'    => $this->whenLoaded('uploader', fn () => [
                'id'    => $this->uploader->id,
                'name'  => $this->uploader->name,
                'email' => $this->uploader->email,
            ]),
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}