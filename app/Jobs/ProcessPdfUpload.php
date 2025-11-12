<?php

namespace App\Jobs;

use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class ProcessPdfUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $maxExceptions = 3;
    public $timeout = 600; // 10 minutes
    public $backoff = [60, 300, 900]; // Retry after 1, 5, and 15 minutes

    protected $file;
    protected $destinationPath;
    protected $options;

    /**
     * Create a new job instance.
     *
     * @param UploadedFile|string $file Either a file upload or path to file
     * @param string $destinationPath Where to store the processed file
     * @param array $options Additional processing options
     */
    public function __construct($file, string $destinationPath = '', array $options = [])
    {
        $this->file = $file;
        $this->destinationPath = rtrim($destinationPath, '/');
        $this->options = array_merge([
            'disk' => 'public',
            'max_size' => 50 * 1024 * 1024, // 50MB
            'allowed_mimes' => ['application/pdf', 'application/x-pdf'],
            'preserve_original' => true,
        ], $options);
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $filePath = $this->prepareFile();
            $this->validateFile($filePath);
            
            $finalPath = $this->storeFile($filePath);
            
            // Dispatch the processing job
            ProcessPdf::dispatch($finalPath, [
                'original_name' => $this->file instanceof UploadedFile 
                    ? $this->file->getClientOriginalName()
                    : basename($filePath),
                'uploaded_at' => now()->toDateTimeString(),
                'options' => $this->options
            ]);

            Log::info('PDF upload processed successfully', [
                'path' => $finalPath,
                'size' => filesize($filePath),
                'options' => $this->options
            ]);

        } catch (Exception $e) {
            Log::error('PDF upload processing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Clean up any temporary files
            if (isset($filePath) && file_exists($filePath)) {
                @unlink($filePath);
            }
            
            throw $e;
        }
    }

    /**
     * Prepare the file for processing
     */
    protected function prepareFile(): string
    {
        if ($this->file instanceof UploadedFile) {
            return $this->file->getRealPath();
        }
        
        if (is_string($this->file) && file_exists($this->file)) {
            return $this->file;
        }
        
        throw new Exception('Invalid file provided for processing');
    }

    /**
     * Validate the file before processing
     */
    protected function validateFile(string $filePath): void
    {
        if (!file_exists($filePath)) {
            throw new Exception("File does not exist: {$filePath}");
        }

        $fileSize = filesize($filePath);
        if ($fileSize === false) {
            throw new Exception("Could not determine file size");
        }

        if ($fileSize > $this->options['max_size']) {
            throw new Exception("File size exceeds maximum allowed size of " . 
                ($this->options['max_size'] / 1024 / 1024) . "MB");
        }

        $mimeType = mime_content_type($filePath);
        if (!in_array($mimeType, $this->options['allowed_mimes'])) {
            throw new Exception("Invalid file type: {$mimeType}");
        }
    }

    /**
     * Store the file in the appropriate location
     */
    protected function storeFile(string $sourcePath): string
    {
        $filename = $this->generateUniqueFilename($sourcePath);
        $destination = $this->destinationPath ? "{$this->destinationPath}/{$filename}" : $filename;
        
        if (!Storage::disk($this->options['disk'])->put($destination, file_get_contents($sourcePath))) {
            throw new Exception("Failed to store file: {$destination}");
        }
        
        return Storage::disk($this->options['disk'])->path($destination);
    }

    /**
     * Generate a unique filename for the uploaded file
     */
    protected function generateUniqueFilename(string $sourcePath): string
    {
        $extension = pathinfo(
            $this->file instanceof UploadedFile 
                ? $this->file->getClientOriginalName() 
                : $sourcePath, 
            PATHINFO_EXTENSION
        );
        
        return uniqid('pdf_', true) . '.' . strtolower($extension);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical('PDF upload processing job failed after all attempts', [
            'error' => $exception->getMessage(),
            'file' => $this->file instanceof UploadedFile 
                ? $this->file->getClientOriginalName() 
                : (string)$this->file,
            'options' => $this->options
        ]);

        // Optional: Notify admin or take other failure actions
    }
}
