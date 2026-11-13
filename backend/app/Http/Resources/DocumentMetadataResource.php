<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentMetadataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'document_name' => $this->document_name,
        ];
    }
}
