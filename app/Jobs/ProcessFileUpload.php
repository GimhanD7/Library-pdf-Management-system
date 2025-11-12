<?php

namespace App\Jobs;

use App\Models\Publication;
use App\Services\FileUploadService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class ProcessFileUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int[]
     */
    public $backoff = [10, 30, 60];

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected array $data,
        protected UploadedFile $file,
        protected int $userId
    ) {}

    /**
     * Execute the job.
     *
     * @param  FileUploadService  $fileUploadService
     * @return Publication
     * @throws \Exception
     */
    public function handle(FileUploadService $fileUploadService)
    {
        try {
            // Set the authenticated user for this job
            auth()->onceUsingId($this->userId);
            
            // Process the file upload synchronously
            $publication = $fileUploadService->processUpload($this->data, $this->file);
            
            // Log success
            Log::info('File uploaded successfully', [
                'publication_id' => $publication->id,
                'original_filename' => $publication->original_filename,
                'user_id' => $this->userId
            ]);
            
            return $publication;
            
        } catch (\Exception $e) {
            Log::error('File upload failed: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => $this->userId,
                'file' => $this->file->getClientOriginalName()
            ]);
            
            // Re-throw the exception to mark the job as failed
            throw $e;
        }
    }
    
    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        Log::error('File upload job failed after all attempts', [
            'error' => $exception->getMessage(),
            'file' => $this->file->getClientOriginalName(),
            'user_id' => $this->userId
        ]);
        
        // Here you could notify the user that the upload failed
        // Notification::send(User::find($this->userId), new UploadFailed($this->file->getClientOriginalName()));
    }
}
