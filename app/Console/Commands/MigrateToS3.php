<?php

namespace App\Console\Commands;

use App\Models\Publication;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateToS3 extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:migrate-to-s3';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate files from local storage to S3';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!Storage::disk('local')->exists('publications')) {
            $this->error('Publications directory does not exist in local storage.');
            return 1;
        }

        $files = Storage::disk('local')->allFiles('publications');
        $totalFiles = count($files);
        $successCount = 0;
        $errorCount = 0;

        $this->info("Found {$totalFiles} files to migrate to S3.");

        $bar = $this->output->createProgressBar($totalFiles);
        $bar->start();

        foreach ($files as $file) {
            try {
                // Check if file exists in S3
                if (!Storage::disk('s3')->exists($file)) {
                    // Read the file
                    $fileContents = Storage::disk('local')->get($file);
                    
                    // Upload to S3
                    Storage::disk('s3')->put($file, $fileContents, 'public');
                    
                    // Update the database record if it exists
                    $publication = Publication::where('file_path', $file)->first();
                    if ($publication) {
                        $publication->update([
                            'file_url' => Storage::disk('s3')->url($file)
                        ]);
                    }
                    
                    $successCount++;
                }
            } catch (\Exception $e) {
                $this->error("Error migrating file {$file}: " . $e->getMessage());
                $errorCount++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        
        $this->info("Migration completed!");
        $this->info("Successfully migrated: {$successCount} files");
        $this->warn("Failed to migrate: {$errorCount} files");
        
        return 0;
    }
}
