<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'document_number',
        'document_name',
        'document_type',
        'partner',
        'document_date',
        'effective_date',
        'expiry_date',
        'start_date',
        'contract_value',
        'is_active',
        'status',
        'description',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'project_id'     => 'integer',
            'created_by'     => 'integer',
            'document_date'  => 'date',
            'effective_date' => 'date',
            'expiry_date'    => 'date',
            'start_date'     => 'date',
            'contract_value' => 'decimal:2',
            'is_active'      => 'boolean',
        ];
    }

    /**
     * Booted method untuk otomatisasi status berdasarkan tanggal.
     */
    protected static function booted()
    {
        static::saving(function ($document) {
            $today = now()->toDateString();

            // Jika tanggal efektif lebih besar dari hari ini (mulai besok/masa depan)
            if ($document->effective_date && $document->effective_date->toDateString() > $today) {
                $document->status = 'draft'; 
            } 
            // Jika tanggal kedaluwarsa sudah lewat dari hari ini
            elseif ($document->expiry_date && $document->expiry_date->toDateString() < $today) {
                $document->status = 'expired';
            } 
            // Jika berada di dalam rentang waktu yang berlaku
            else {
                $document->status = 'active';
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(DocumentVersion::class);
    }

    public function latestVersion(): HasOne
    {
        return $this->hasOne(DocumentVersion::class)->latestOfMany();
    }

    /**
     * Relasi untuk mengambil versi aktif / versi terbaru dokumen.
     */
    public function activeVersion()
    {
        return $this->hasOne(DocumentVersion::class)->latestOfMany();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}