<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class Publication extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name',
        'title',
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
        'user_id',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'year' => 'integer',
        'month' => 'integer',
        'day' => 'integer',
        'page' => 'integer',
        'user_id' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($publication) {
            Log::info('Creating new publication', [
                'filename' => $publication->original_filename,
                'path' => $publication->file_path,
                'user_id' => $publication->user_id
            ]);
        });

        static::created(function ($publication) {
            Log::info('Publication created', [
                'id' => $publication->id,
                'filename' => $publication->original_filename
            ]);
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the file URL for the publication.
     *
     * @return string
     */
    public function getFileUrlAttribute($value)
    {
        // If file_url is already set, return it
        if (!empty($value)) {
            return $value;
        }

        // Otherwise, generate it from file_path
        if (!empty($this->file_path)) {
            return Storage::url($this->file_path);
        }

        return '';
    }

    /**
     * Get the full path to the file.
     *
     * @return string
     */
    public function getFullPathAttribute()
    {
        if (empty($this->file_path)) {
            return '';
        }
        
        return Storage::path($this->file_path);
    }

    /**
     * Check if the file exists in storage.
     *
     * @return bool
     */
    public function fileExists()
    {
        return !empty($this->file_path) && Storage::exists($this->file_path);
    }
}
