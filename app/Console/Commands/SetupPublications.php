<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class SetupPublications extends Command
{
    protected $signature = 'publications:setup';
    protected $description = 'Set up the publications directory structure and move PDF files';

    public function handle()
    {
        $sourceDir = storage_path('app/1954');
        $targetDir = storage_path('app/public/1954');

        // Create target directory if it doesn't exist
        if (!File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
            $this->info("Created directory: {$targetDir}");
        }

        // Copy files from source to target
        if (File::exists($sourceDir)) {
            $this->info("Copying files from {$sourceDir} to {$targetDir}...");
            File::copyDirectory($sourceDir, $targetDir);
            $this->info("Files copied successfully!");
        } else {
            $this->error("Source directory not found: {$sourceDir}");
            return 1;
        }

        $this->info("Publication files are now accessible at: " . asset('storage/1954'));
        return 0;
    }
}
