<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentVersion extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'document_id',
        'version_number',
        'file_name',
        'file_path',
        'file_hash',
        'file_size',
        'mime_type',
        'is_current',
        'encrypted_at',
        'uploaded_by',
        'notes',
    ];

    protected $casts = [
        'document_id'  => 'integer',
        'uploaded_by'  => 'integer',
        'file_size'    => 'integer',
        'is_current'   => 'boolean',
        'encrypted_at' => 'datetime',
        'deleted_at'   => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}