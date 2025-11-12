<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illware\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    // Test database connection
    DB::connection()->getPdo();
    echo "Database connection successful!\n";
    
    // Check if publications table exists
    if (DB::getSchemaBuilder()->hasTable('publications')) {
        echo "Publications table exists.\n";
        
        // Get column listing
        $columns = DB::getSchemaBuilder()->getColumnListing('publications');
        echo "Columns in publications table: " . implode(', ', $columns) . "\n";
    } else {
        echo "Publications table does not exist.\n";
    }
    
} catch (\Exception $e) {
    die("Could not connect to the database. Error: " . $e->getMessage() . "\n");
}
