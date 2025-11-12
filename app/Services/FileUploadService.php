<?php

namespace App\Services;

use App\Models\Publication;
use Illuminate\Http\UploadedFile;
use App\Jobs\ProcessFileUpload;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadService
{
    /**
     * The disk to use for file storage.
     *
     * @var string
     */
    protected $disk;

    /**
     * The directory to store uploaded files.
     *
     * @var string
     */
    protected $directory;

    /**
     * Create a new FileUploadService instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->disk = config('file-uploads.defaults.disk');
        $this->directory = rtrim(config('file-uploads.defaults.directory'), '/');
    }

    /**
     * Get the storage disk.
     *
     * @return string
     */
    public function getDisk(): string
    {
        return $this->disk;
    }

    /**
     * Set the storage disk.
     *
     * @param  string  $disk
     * @return $this
     */
    public function setDisk(string $disk): self
    {
        $this->disk = $disk;
        return $this;
    }

    /**
     * Get the storage directory.
     *
     * @return string
     */
    public function getDirectory(): string
    {
        return $this->directory;
    }

    /**
     * Set the storage directory.
     *
     * @param  string  $directory
     * @return $this
     */
    public function setDirectory(string $directory): self
    {
        $this->directory = rtrim($directory, '/');
        return $this;
    }

    /**
     * Upload a publication file and create a publication record.
     *
     * @param array $data
     * @param UploadedFile $file
     * @param bool|null $processInBackground Whether to process the upload in the background
     * @return Publication|\Illuminate\Foundation\Bus\PendingDispatch
     * @throws \Exception
     */
    public function uploadPublication(array $data, UploadedFile $file, ?bool $processInBackground = null)
    {
        // Use config default if not specified
        $processInBackground = $processInBackground ?? config('file-uploads.queue.enable', true);
        
        // Validate the file
        $this->validateFile($file);
        
        // If processing in background, dispatch the job with the file
        if ($processInBackground) {
            return ProcessFileUpload::dispatch($data, $file, auth()->id())->onQueue(config('file-uploads.queue.queue', 'file-uploads'));
        }
        
        // Otherwise, process synchronously
        return $this->processUpload($data, $file);
    }
    
    /**
     * Process the file upload synchronously.
     *
     * @param array $data
     * @param UploadedFile $file
     * @return Publication
     * @throws \Exception
     */
    protected function processUpload(array $data, UploadedFile $file)
    {
        try {
            // Parse the filename to extract name, year, month, day, and page
            $filename = $file->getClientOriginalName();
            $parsed = $this->parseFilename($filename);
            
            // Log the parsed data for debugging
            \Log::info('Processing file upload', [
                'filename' => $filename,
                'parsed_data' => $parsed,
                'input_data' => $data
            ]);
            
            // Determine the storage path based on the parsed data
            $directory = $this->buildStoragePath(
                $data['name'] ?? $parsed['name'],
                $data['year'] ?? $parsed['year'],
                $data['month'] ?? $parsed['month'],
                $data['day'] ?? $parsed['day']
            );
            
            // Ensure the directory exists
            if (!Storage::disk($this->disk)->exists($directory)) {
                Storage::disk($this->disk)->makeDirectory($directory, 0755, true);
            }
            
            // Store the file
            $path = $file->storeAs($directory, $filename, $this->disk);
            
            if (!$path) {
                throw new \Exception('Failed to store file on disk');
            }
            
            // Get the full URL to the stored file
            $url = Storage::disk($this->disk)->url($path);
            
            // Create publication data
            $publicationData = [
                'user_id' => auth()->id(),
                'name' => $data['name'] ?? $parsed['name'],
                'title' => $data['title'] ?? $parsed['name'],
                'description' => $data['description'] ?? null,
                'original_filename' => $filename,
                'file_path' => $path,
                'file_url' => $url,
                'mime_type' => $file->getClientMimeType(),
                'file_size' => $file->getSize(),
                'year' => $data['year'] ?? $parsed['year'] ?? date('Y'),
                'month' => $data['month'] ?? $parsed['month'] ?? date('m'),
                'day' => $data['day'] ?? $parsed['day'] ?? date('d'),
                'page' => $data['page'] ?? $parsed['page'] ?? null
            ];
            
            // Log the publication data before creation
            \Log::info('Creating publication record', $publicationData);
            
            // Create and return the publication
            return $this->createPublication($publicationData);
            
        } catch (\Exception $e) {
            \Log::error('File upload processing failed', [
                'error' => $e->getMessage(),
                'file' => $filename ?? 'unknown',
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
    
    /**
     * Validate the file.
     *
     * @param UploadedFile $file
     * @throws \Exception
     */
    protected function validateFile(UploadedFile $file)
    {
        // Validate file type
        $allowedMimeTypes = config('file-uploads.defaults.allowed_mime_types', ['application/pdf']);
        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            throw new \Exception('File type not allowed. Allowed types: ' . implode(', ', $allowedMimeTypes));
        }
        
        // Validate file size
        $maxFileSize = config('file-uploads.defaults.max_file_size', 10240) * 1024; // Convert KB to bytes
        if ($file->getSize() > $maxFileSize) {
            throw new \Exception('File size exceeds the maximum allowed size of ' . ($maxFileSize / 1024) . 'KB');
        }
    }
    
    /**
     * Create a publication.
     *
     * @param array $data
     * @return Publication
     */
    protected function createPublication(array $data)
    {
        try {
            // Create the publication without transaction
            $publication = new Publication();
            
            // Manually set attributes
            $publication->name = $data['name'];
            $publication->title = $data['title'] ?? $data['name'];
            $publication->description = $data['description'] ?? null;
            $publication->original_filename = $data['original_filename'];
            $publication->file_path = $data['file_path'];
            $publication->file_url = $data['file_url'] ?? '';
            $publication->mime_type = $data['mime_type'];
            $publication->file_size = $data['file_size'];
            $publication->year = $data['year'] ?? date('Y');
            $publication->month = $data['month'] ?? date('m');
            $publication->day = $data['day'] ?? date('d');
            $publication->page = $data['page'] ?? null;
            $publication->user_id = $data['user_id'] ?? auth()->id();
            
            // Save the publication
            if (!$publication->save()) {
                throw new \Exception('Failed to save publication to database');
            }
            
            return $publication;
            
        } catch (\Exception $e) {
            \Log::error('Failed to create publication: ' . $e->getMessage(), [
                'data' => $data,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw new \Exception('Failed to create publication: ' . $e->getMessage());
        }
    }
    
    /**
     * Build the storage path for a file based on its metadata.
     *
     * @param string $name
     * @param int|null $year
     * @param int|null $month
     * @param int|null $day
     * @return string
     */
    protected function buildStoragePath(string $name, ?int $year, ?int $month, ?int $day): string
    {
        $name = strtolower($name);
        $path = "publications/{$name}";
        
        if ($year) {
            $path .= "/{$year}";
            if ($month) {
                $path .= "/" . str_pad($month, 2, '0', STR_PAD_LEFT);
                if ($day) {
                    $path .= "/" . str_pad($day, 2, '0', STR_PAD_LEFT);
                }
            }
        }
        
        return $path;
    }
    
    /**
     * Parse a filename to extract name, year, month, day, and page.
     * Expected format: NAME-YYYY-MM-DD.pdf or NAME-YYYY-MM-DDNNNN.pdf (where NNNN is page number)
     *
     * @param string $filename
     * @return array
     */
    protected function parseFilename(string $filename): array
    {
        $name = pathinfo($filename, PATHINFO_FILENAME);
        $parts = explode('-', $name);
        
        $result = [
            'name' => $parts[0] ?? 'unknown',
            'year' => null,
            'month' => null,
            'day' => null,
            'page' => null
        ];
        
        if (count($parts) >= 4) {
            $result['year'] = (int)($parts[1] ?? null);
            $result['month'] = (int)($parts[2] ?? null);
            $dayPart = $parts[3] ?? '';
            
            // Extract day and page (format: DD or DDNNNN where NNNN is the page number)
            if (preg_match('/^(\d{2})(\d*)$/', $dayPart, $matches)) {
                $result['day'] = (int)($matches[1] ?? null);
                $result['page'] = !empty($matches[2]) ? (int)$matches[2] : null;
            } else {
                $result['day'] = (int)$dayPart;
            }
        }
        
        return $result;
    }

    /**
     * Delete a publication and its associated file.
     *
     * @param  Publication  $publication
     * @return bool
     * @throws \Exception
     */
    public function deletePublication(Publication $publication): bool
    {
        try {
            // Build the file path from the publication data
            $filename = $publication->original_filename;
            $filePath = $this->buildStoragePath(
                pathinfo($filename, PATHINFO_FILENAME),
                $publication->year,
                $publication->month,
                $publication->day
            ) . '/' . $filename;
            
            // Delete the file from storage
            if (Storage::disk($this->disk)->exists($filePath)) {
                Storage::disk($this->disk)->delete($filePath);
            }
            
            // Delete the database record
            return (bool) $publication->delete();
            
        } catch (\Exception $e) {
            Log::error('Failed to delete publication', [
                'publication_id' => $publication->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to delete publication: ' . $e->getMessage());
        }
    }

    /**
     * Generate a unique file name.
     *
     * @param  string  $originalName
     * @return string
     */
    protected function generateFileName(string $originalName): string
    {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $baseName = pathinfo($originalName, PATHINFO_FILENAME);
        
        // Sanitize the base name
        $baseName = Str::slug($baseName);
        
        // Generate file name based on the configured strategy
        $strategy = config('file-uploads.naming.strategy', 'original');
        $separator = config('file-uploads.naming.separator', '_');
        
        switch ($strategy) {
            case 'hash':
                $uniqueId = md5(uniqid('', true));
                return "{$baseName}{$separator}{$uniqueId}.{$extension}";
                
            case 'timestamp':
                $timestamp = now()->format('Ymd_His');
                return "{$baseName}{$separator}{$timestamp}.{$extension}";
                
            case 'uuid':
                return (string) Str::uuid() . ".{$extension}";
                
            case 'original':
            default:
                $random = Str::random(10);
                return "{$baseName}{$separator}{$random}.{$extension}";
        }
    }

}
