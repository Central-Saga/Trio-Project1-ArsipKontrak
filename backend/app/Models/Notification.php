<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'recipient_user_id',
        'type',
        'sent_at',
        'read_at',
    ];

    protected $casts = [
        'document_id'       => 'integer',
        'recipient_user_id' => 'integer',
        'sent_at'           => 'datetime',
        'read_at'           => 'datetime',
    ];

    /**
     * Relasi ke dokumen terkait.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * Relasi ke user penerima notifikasi.
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }
}