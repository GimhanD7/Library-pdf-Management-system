<?php

namespace App\Jobs;

use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Smalot\PdfParser\Parser;

class ProcessPdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $maxExceptions = 3;
    public $timeout = 300; // 5 minutes
    public $backoff = [60, 300, 600]; // Retry after 1, 5, and 10 minutes

    protected $filePath;
    protected $metadata;

    /**
     * Create a new job instance.
     *
     * @param string $filePath Path to the PDF file
     * @param array $metadata Additional metadata for processing
     */
    public function __construct(string $filePath, array $metadata = [])
    {
        $this->filePath = $filePath;
        $this->metadata = $metadata;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            if (!file_exists($this->filePath)) {
                throw new Exception("File not found: {$this->filePath}");
            }

            $parser = new Parser();
            $pdf = $parser->parseFile($this->filePath);
            
            // Extract text and metadata
            $text = $pdf->getText();
            $details = $pdf->getDetails();

            // Process the extracted data
            $this->processPdfContent($text, $details);
            
            Log::info('Successfully processed PDF', [
                'file' => $this->filePath,
                'pages' => $details['Pages'] ?? 'unknown',
                'size' => filesize($this->filePath)
            ]);

        } catch (\Exception $e) {
            Log::error('PDF processing failed', [
                'file' => $this->filePath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw to trigger retry logic
            throw $e;
        }
    }

    /**
     * Process the extracted PDF content
     */
    protected function processPdfContent(string $text, array $details): void
    {
        // Implement your PDF processing logic here
        // Example: Save to database, extract specific data, etc.
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical('PDF processing job failed after all attempts', [
            'file' => $this->filePath,
            'error' => $exception->getMessage(),
            'metadata' => $this->metadata
        ]);

        // Optional: Notify admin or take other failure actions
    }
}
