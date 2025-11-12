<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

// Get the connection
$connection = DB::connection();

// Get the schema builder
$schema = $connection->getSchemaBuilder();

// Check if the columns exist
$columns = $schema->getColumnListing('users');

echo "Columns in users table:\n";
print_r($columns);

// Check if the migration has been run
$migrations = DB::table('migrations')->get();

echo "\nMigrations that have been run:\n";
foreach ($migrations as $migration) {
    echo $migration->migration . "\n";
}
