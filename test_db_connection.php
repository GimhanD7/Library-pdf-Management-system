<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

try {
    // Test database connection
    DB::connection()->getPdo();
    echo "✅ Successfully connected to the database: " . Config::get('database.connections.mysql.database') . "\n";
    
    // List all tables
    $tables = DB::select('SHOW TABLES');
    
    if (empty($tables)) {
        echo "ℹ️  No tables found in the database.\n";
    } else {
        echo "📊 Database tables:\n";
        foreach ($tables as $table) {
            $tableName = array_values((array)$table)[0];
            echo "- $tableName\n";
        }
    }
    
} catch (\Exception $e) {
    echo "❌ Could not connect to the database. Error: " . $e->getMessage() . "\n";
    
    // Show database configuration (without password)
    echo "\n🔧 Current database configuration:\n";
    echo "- Host: " . Config::get('database.connections.mysql.host') . "\n";
    echo "- Port: " . Config::get('database.connections.mysql.port') . "\n";
    echo "- Database: " . Config::get('database.connections.mysql.database') . "\n";
    echo "- Username: " . Config::get('database.connections.mysql.username') . "\n";
    
    // Check if MySQL is running
    echo "\n🔍 Checking if MySQL is running...\n";
    $output = [];
    $result = 0;
    exec('tasklist /FI "IMAGENAME eq mysqld.exe" 2>&1', $output, $result);
    
    if (strpos(implode("\n", $output), 'mysqld.exe') !== false) {
        echo "✅ MySQL is running.\n";
    } else {
        echo "❌ MySQL is not running. Please start MySQL service.\n";
    }
}
