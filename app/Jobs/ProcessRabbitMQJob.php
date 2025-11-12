<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessRabbitMQJob implements ShouldQueue
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
     * @var int
     */
    public $backoff = 3;

    /**
     * The message data.
     *
     * @var mixed
     */
    protected $message;

    /**
     * Create a new job instance.
     *
     * @param  mixed  $message
     * @return void
     */
    public function __construct($message)
    {
        $this->message = $message;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            // Process the message here
            Log::info('Processing RabbitMQ job', [
                'message' => $this->message,
                'timestamp' => now()->toDateTimeString(),
            ]);

            // Example: Process the message
            // $this->processMessage($this->message);
            
            // If you need to dispatch another job
            // AnotherJob::dispatch($data);
            
        } catch (\Exception $e) {
            Log::error('Error processing RabbitMQ job: ' . $e->getMessage(), [
                'exception' => $e,
                'message' => $this->message,
            ]);
            
            // Re-throw the exception to trigger retry logic
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @param  \Throwable  $exception
     * @return void
     */
    public function failed(\Throwable $exception)
    {
        // Send user notification of failure, etc.
        Log::error('RabbitMQ job failed after all attempts', [
            'exception' => $exception->getMessage(),
            'message' => $this->message,
        ]);
    }
}
