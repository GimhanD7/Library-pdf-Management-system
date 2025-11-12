<?php

use App\Http\Controllers\Api\PublicationController;
use App\Http\Controllers\RabbitMQController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public test route (no auth required for testing)
Route::get('/test-s3', [PublicationController::class, 'testS3']);

// Test route for report generation
Route::get('/test-report', function() {
    return response()->json(['message' => 'Test route works!']);
});

// RabbitMQ test routes
Route::post('/rabbitmq/send', [RabbitMQController::class, 'sendMessage']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Report generation
    Route::get('/reports/generate', [ReportController::class, 'generate']);
    
    // Publication routes
    Route::apiResource('publications', PublicationController::class)->except(['update', 'show']);
    
    // Additional routes for filtering
    Route::get('publications/year/{year}', [PublicationController::class, 'index']);
    Route::get('publications/year/{year}/month/{month}', [PublicationController::class, 'index']);
});
