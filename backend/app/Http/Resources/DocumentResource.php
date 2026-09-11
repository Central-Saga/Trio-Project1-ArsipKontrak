<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'project_id'      => $this->project_id,
            'project'         => $this->whenLoaded('project', fn () => [
                'id'           => $this->project?->id,
                'project_code' => $this->project?->project_code,
                'project_name' => $this->project?->project_name,
            ]),
            'document_number' => $this->document_number,
            'document_name'   => $this->document_name,
            'document_type'   => $this->document_type,
            'partner'         => $this->partner,
            'document_date'   => $this->document_date?->format('Y-m-d'),
            'effective_date'  => $this->effective_date?->format('Y-m-d'),
            'expiry_date'     => $this->expiry_date?->format('Y-m-d'),
            'status'          => $this->status,
            'description'     => $this->description,
            'creator'         => $this->whenLoaded('creator', fn () => [
                'id'    => $this->creator?->id,
                'name'  => $this->creator?->name,
                'email' => $this->creator?->email,
            ]),
            'current_version' => $this->relationLoaded('latestVersion') && $this->latestVersion
                ? new DocumentVersionResource($this->latestVersion)
                : null,
            'versions'        => DocumentVersionResource::collection($this->whenLoaded('versions')),
            'created_at'      => $this->created_at?->toIso8601String(),
            'updated_at'      => $this->updated_at?->toIso8601String(),
            'deleted_at'      => $this->deleted_at?->toIso8601String(),
        ];
    }
}