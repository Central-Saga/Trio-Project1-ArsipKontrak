<?php

namespace App\DTO;

final readonly class UpdateDocumentData
{
    public function __construct(
        public ?int $projectId = null,
        public ?string $documentNumber = null,
        public ?string $documentName = null,
        public ?string $documentType = null,
        public ?string $partner = null,
        public ?string $documentDate = null,
        public ?string $effectiveDate = null,
        public ?string $expiryDate = null,
        public ?string $status = null,
        public ?string $description = null,
        public bool $hasDescription = false,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        return new self(
            projectId: isset($validated['project_id']) ? (int) $validated['project_id'] : null,
            documentNumber: isset($validated['document_number']) ? (string) $validated['document_number'] : null,
            documentName: isset($validated['document_name']) ? (string) $validated['document_name'] : null,
            documentType: isset($validated['document_type']) ? (string) $validated['document_type'] : null,
            partner: isset($validated['partner']) ? (string) $validated['partner'] : null,
            documentDate: isset($validated['document_date']) ? (string) $validated['document_date'] : null,
            effectiveDate: isset($validated['effective_date']) ? (string) $validated['effective_date'] : null,
            expiryDate: isset($validated['expiry_date']) ? (string) $validated['expiry_date'] : null,
            status: isset($validated['status']) ? (string) $validated['status'] : null,
            description: isset($validated['description']) ? (string) $validated['description'] : null,
            hasDescription: array_key_exists('description', $validated),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toAttributes(): array
    {
        $attributes = [];

        if ($this->projectId !== null) {
            $attributes['project_id'] = $this->projectId;
        }

        if ($this->documentNumber !== null) {
            $attributes['document_number'] = $this->documentNumber;
        }

        if ($this->documentName !== null) {
            $attributes['document_name'] = $this->documentName;
        }

        if ($this->documentType !== null) {
            $attributes['document_type'] = $this->documentType;
        }

        if ($this->partner !== null) {
            $attributes['partner'] = $this->partner;
        }

        if ($this->documentDate !== null) {
            $attributes['document_date'] = $this->documentDate;
        }

        if ($this->effectiveDate !== null) {
            $attributes['effective_date'] = $this->effectiveDate;
        }

        if ($this->expiryDate !== null) {
            $attributes['expiry_date'] = $this->expiryDate;
        }

        if ($this->status !== null) {
            $attributes['status'] = $this->status;
        }

        if ($this->hasDescription) {
            $attributes['description'] = $this->description;
        }

        return $attributes;
    }
}
