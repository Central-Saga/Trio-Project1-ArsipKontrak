<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdempotencyKey extends Model
{
    protected $fillable = [
        'user_id',
        'scope',
        'key',
        'request_hash',
        'status',
        'response_status',
        'response_body',
        'response_headers',
        'expires_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'response_status' => 'integer',
        'response_headers' => 'array',
        'expires_at' => 'datetime',
    ];
}
