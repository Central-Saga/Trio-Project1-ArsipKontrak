<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Request;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'document_id',
        'action',
        'description',
        'ip_address',
    ];

    public $timestamps = false; // Karena di migrasi kamu hanya pakai created_at manual

    protected $casts = [
        'user_id'     => 'integer',
        'document_id' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    // Fungsi helper untuk mencatat log dengan mudah
    public static function record($userId, string $action, ?string $description = null, ?int $documentId = null)
    {
        return self::create([
            'user_id'     => $userId,
            'document_id' => $documentId,
            'action'      => $action,
            'description' => $description,
            'ip_address'  => Request::ip(),
        ]);
    }
}