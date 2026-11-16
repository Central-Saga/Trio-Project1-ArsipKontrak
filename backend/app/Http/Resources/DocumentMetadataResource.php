<?php

namespace App\Http\Resources;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Document
 */
class DocumentMetadataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'document_name' => $this->document_name,
        ];
    }
}
