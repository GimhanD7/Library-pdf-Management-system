<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// List all tables in the database
$tables = DB::select('SHOW TABLES');

echo "=== Database Tables ===\n";
foreach ($tables as $table) {
    $tableName = array_values((array)$table)[0];
    echo "Table: $tableName\n";
    
    // Get columns for each table
    $columns = DB::select("SHOW COLUMNS FROM `$tableName`");
    foreach ($columns as $column) {
        echo "  - {$column->Field} ({$column->Type})\n";
    }
    echo "\n";
}
