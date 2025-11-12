<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeletedPublication extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_id',
        'name',
        'title',
        'code',
        'description',
        'original_filename',
        'file_path',
        'file_url',
        'mime_type',
        'file_size',
        'year',
        'month',
        'day',
        'page',
        'type',
        'user_id',
        'is_disabled',
        'is_valid',
        'deleted_by',
        'deleted_reason',
        'original_created_at',
        'original_updated_at',
        'deleted_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'year' => 'integer',
        'month' => 'integer',
        'day' => 'integer',
        'page' => 'integer',
        'is_disabled' => 'boolean',
        'is_valid' => 'boolean',
        'original_created_at' => 'datetime',
        'original_updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user who owned the publication.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the user who deleted the publication.
     */
    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
