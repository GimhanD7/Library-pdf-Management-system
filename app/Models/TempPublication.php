<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class TempPublication extends Model
{
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
        'status',
        'admin_notes',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'year' => 'integer',
        'month' => 'integer',
        'day' => 'integer',
        'page' => 'integer',
        'user_id' => 'integer',
        'verified_by' => 'integer',
        'verified_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($tempPublication) {
            Log::info('Creating new temp publication', [
                'filename' => $tempPublication->original_filename,
                'path' => $tempPublication->file_path,
                'user_id' => $tempPublication->user_id,
                'status' => $tempPublication->status
            ]);
        });

        static::created(function ($tempPublication) {
            Log::info('Temp publication created', [
                'id' => $tempPublication->id,
                'filename' => $tempPublication->original_filename,
                'status' => $tempPublication->status
            ]);
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Get the file URL for the temp publication.
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
        if (empty($this->file_path)) {
            return false;
        }
        
        // Try both default disk and public disk
        $disk = Storage::disk('public');
        return $disk->exists($this->file_path) || Storage::exists($this->file_path);
    }

    /**
     * Approve this temp publication and move it to publications table.
     *
     * @param int $adminId
     * @param string|null $notes
     * @return Publication|null
     */
    public function approve(int $adminId, string $notes = null)
    {
        try {
            // Try to move file to publications storage, but don't fail if file is missing
            $newFilePath = null;
            if ($this->fileExists()) {
                $newFilePath = $this->moveToPublicationsStorage();
                if (!$newFilePath) {
                    Log::error('Failed to move file to publications storage', [
                        'temp_id' => $this->id,
                        'original_file_path' => $this->file_path,
                        'file_exists' => $this->fileExists()
                    ]);
                }
            } else {
                Log::warning('File does not exist, creating publication without file for testing', [
                    'temp_id' => $this->id,
                    'file_path' => $this->file_path
                ]);
                // Use the original file path even if file doesn't exist
                $newFilePath = $this->file_path;
            }

            // Create publication record - handle required fields
            $publication = Publication::create([
                'name' => $this->name ?: 'Untitled Publication',
                'title' => $this->title ?: 'Untitled Publication',
                'description' => $this->description,
                'original_filename' => $this->original_filename,
                'file_path' => $newFilePath,
                'file_url' => $this->file_url ?: Storage::disk('public')->url($newFilePath),
                'mime_type' => $this->mime_type ?: 'application/pdf',
                'file_size' => $this->file_size ?: 0,
                'year' => $this->year ?: date('Y'),
                'month' => $this->month ?: date('n'),
                'day' => $this->day ?: date('j'),
                'page' => $this->page,
                'user_id' => $this->user_id,
            ]);

            if ($publication) {
                // Update temp publication status
                $this->update([
                    'status' => 'approved',
                    'verified_by' => $adminId,
                    'verified_at' => now(),
                    'admin_notes' => $notes,
                ]);

                Log::info('Temp publication approved', [
                    'temp_id' => $this->id,
                    'publication_id' => $publication->id,
                    'admin_id' => $adminId,
                    'new_file_path' => $newFilePath
                ]);

                return $publication;
            } else {
                Log::error('Failed to create publication record', [
                    'temp_id' => $this->id,
                    'admin_id' => $adminId
                ]);
                throw new \Exception('Failed to create publication record');
            }
        } catch (\Exception $e) {
            Log::error('Error in approve method: ' . $e->getMessage(), [
                'temp_id' => $this->id,
                'admin_id' => $adminId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Reject this temp publication.
     *
     * @param int $adminId
     * @param string $reason
     * @return bool
     */
    public function reject(int $adminId, string $reason)
    {
        $updated = $this->update([
            'status' => 'rejected',
            'verified_by' => $adminId,
            'verified_at' => now(),
            'admin_notes' => $reason,
        ]);

        if ($updated) {
            Log::info('Temp publication rejected', [
                'temp_id' => $this->id,
                'admin_id' => $adminId,
                'reason' => $reason
            ]);
        }

        return $updated;
    }

    /**
     * Move file from temp storage to publications storage.
     *
     * @return string|null New file path
     */
    private function moveToPublicationsStorage()
    {
        try {
            $disk = Storage::disk('public');
            
            // Check if file exists
            if (!$disk->exists($this->file_path)) {
                Log::error('File does not exist for temp publication', [
                    'temp_id' => $this->id,
                    'file_path' => $this->file_path,
                    'full_path' => $disk->path($this->file_path),
                    'file_exists_check' => file_exists($disk->path($this->file_path))
                ]);
                return null;
            }

            // Validate required fields with fallbacks
            $name = $this->name ?: 'publication';
            $year = $this->year ?: date('Y');
            $month = $this->month ?: date('n');
            $day = $this->day ?: date('j');
            $filename = $this->original_filename;
            
            if (!$filename) {
                Log::error('Missing original filename for file move', [
                    'temp_id' => $this->id,
                    'original_filename' => $this->original_filename
                ]);
                return null;
            }

            // Generate new path in publications directory
            $sluggedName = \Illuminate\Support\Str::slug($name);
            $newDirectory = sprintf('publications/%s/%04d/%02d/%02d', 
                $sluggedName, 
                (int)$year, 
                (int)$month, 
                (int)$day
            );

            $newPath = $newDirectory . '/' . $filename;

            // Ensure directory exists
            $disk = Storage::disk('public');
            if (!$disk->exists($newDirectory)) {
                if (!$disk->makeDirectory($newDirectory, 0755, true)) {
                    Log::error('Failed to create directory', [
                        'temp_id' => $this->id,
                        'directory' => $newDirectory
                    ]);
                    return null;
                }
            }

            // Handle duplicate filenames
            $pathInfo = pathinfo($filename);
            $counter = 1;
            $originalNewPath = $newPath;
            while ($disk->exists($newPath)) {
                $extension = isset($pathInfo['extension']) ? '.' . $pathInfo['extension'] : '';
                $newPath = $newDirectory . '/' . $pathInfo['filename'] . '-' . $counter . $extension;
                $counter++;
                
                // Prevent infinite loop
                if ($counter > 100) {
                    Log::error('Too many duplicate files, stopping at counter 100', [
                        'temp_id' => $this->id,
                        'original_filename' => $filename,
                        'directory' => $newDirectory
                    ]);
                    return null;
                }
            }

            // Log the move attempt
            Log::info('Attempting to move file', [
                'temp_id' => $this->id,
                'from' => $this->file_path,
                'to' => $newPath,
                'from_exists' => $disk->exists($this->file_path),
                'to_directory_exists' => $disk->exists($newDirectory)
            ]);

            // Move the file
            if ($disk->move($this->file_path, $newPath)) {
                Log::info('File moved successfully', [
                    'temp_id' => $this->id,
                    'from' => $this->file_path,
                    'to' => $newPath,
                    'new_file_exists' => $disk->exists($newPath)
                ]);
                return $newPath;
            } else {
                Log::error('Failed to move file', [
                    'temp_id' => $this->id,
                    'from' => $this->file_path,
                    'to' => $newPath,
                    'from_exists' => $disk->exists($this->file_path),
                    'to_directory_exists' => $disk->exists($newDirectory),
                    'disk_path' => $disk->path('')
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error('Exception in moveToPublicationsStorage: ' . $e->getMessage(), [
                'temp_id' => $this->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Get status badge color.
     *
     * @return string
     */
    public function getStatusColorAttribute()
    {
        return match($this->status) {
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            default => 'gray'
        };
    }

    /**
     * Get status display text.
     *
     * @return string
     */
    public function getStatusTextAttribute()
    {
        return match($this->status) {
            'pending' => 'Pending Verification',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            default => 'Unknown'
        };
    }
}
