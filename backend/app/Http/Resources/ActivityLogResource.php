<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'document_id' => $this->document_id,
            'action' => $this->action,
            'description' => $this->description,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'role' => $this->user?->role,
            ]),
            'document' => $this->whenLoaded('document', fn () => [
                'id' => $this->document?->id,
                'document_number' => $this->document?->document_number,
                'document_name' => $this->document?->document_name,
            ]),
        ];
    }
}
