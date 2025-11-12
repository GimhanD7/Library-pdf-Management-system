<?php

namespace App\Console\Commands;

use App\Jobs\ProcessPdf;
use App\Models\Publication;
use Illuminate\Console\Command;
use Illuminate\Console\Input\InputOption;
use Illuminate\Support\Facades\Log;

class ConsumePdfQueue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'queue:consume-pdf
                            {--timeout=60 : The number of seconds a child process can run}
                            {--tries=3 : Number of times to attempt processing a job}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Consume PDF processing queue';

    /**
     * Indicates if the worker should exit.
     *
     * @var bool
     */
    protected $shouldQuit = false;

    /**
     * The output interface implementation.
     *
     * @var \Symfony\Component\Console\Output\OutputInterface
     */
    protected $output;

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Starting PDF queue processing. To exit press Ctrl+C');
        $this->output = $this->getOutput();

        // Windows compatibility - register shutdown function instead of signal handlers
        register_shutdown_function([$this, 'shutdown']);

        // Handle Ctrl+C in Windows console
        if (function_exists('sapi_windows_set_ctrl_handler') && defined('PHP_WINDOWS_EVENT_CTRL_C')) {
            sapi_windows_set_ctrl_handler(function($event) {
                if ($event === PHP_WINDOWS_EVENT_CTRL_C) {
                    $this->shutdown();
                }
            });
        }

        try {
            // Process PDFs directly without RabbitMQ
            while (true) {
                if ($this->shouldQuit) {
                    $this->info('Shutting down...');
                    break;
                }

                // Process any pending PDF processing jobs
                // This is a simple implementation that can be enhanced as needed

                // Sleep briefly to prevent high CPU usage
                usleep(100000); // 100ms
            }

        } catch (\Exception $e) {
            $this->error('Error in queue processor: ' . $e->getMessage());
            Log::error('Fatal error in PDF queue processor: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }

        return 0;
    }

    /**
     * Shutdown the worker.
     *
     * @return void
     */
    protected function shutdown()
    {
        $this->shouldQuit = true;

        if ($this->output) {
            $this->info('Shutting down...');
        }
    }

    /**
     * Get the console command options.
     *
     * @return array
     */
    protected function getOptions()
    {
        return [
            ['timeout', null, InputOption::VALUE_OPTIONAL, 'The number of seconds a child process can run', 60],
            ['tries', null, InputOption::VALUE_OPTIONAL, 'Number of times to attempt processing a job', 3],
        ];
    }
}
