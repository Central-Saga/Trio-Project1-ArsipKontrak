<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'document_id' => $this->document_id,
            'recipient_user_id' => $this->recipient_user_id,
            'type' => $this->type,
            'sent_at' => $this->sent_at?->toIso8601String(),
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'document' => $this->whenLoaded('document', fn () => [
                'id' => $this->document?->id,
                'document_name' => $this->document?->document_name,
                'document_number' => $this->document?->document_number,
            ]),
        ];
    }
}
