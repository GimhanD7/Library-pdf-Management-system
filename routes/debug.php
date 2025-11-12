<?php

/**
 * Debug Routes
 * 
 * WARNING: These routes should ONLY be enabled in development/local environments.
 * Remove or disable in production for security.
 * 
 * Usage: Only include this file when APP_ENV=local
 */

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

// Only register debug routes in local environment
if (app()->environment('local')) {
    
    Route::prefix('debug')->middleware('auth')->group(function () {
        
        // Database debugging
        Route::get('/db', function() {
            try {
                $pdo = DB::connection()->getPdo();
                $tableExists = DB::getSchemaBuilder()->hasTable('publications');
                
                if (!$tableExists) {
                    return [
                        'status' => 'error',
                        'message' => 'Publications table does not exist',
                        'suggestion' => 'Run: php artisan migrate'
                    ];
                }
                
                $columns = DB::getSchemaBuilder()->getColumnListing('publications');
                
                return [
                    'status' => 'success',
                    'message' => 'Database connection successful',
                    'tables' => ['publications' => $columns]
                ];
            } catch (\Exception $e) {
                return [
                    'status' => 'error',
                    'message' => 'Database connection failed',
                    'error' => $e->getMessage()
                ];
            }
        });
        
        // Storage debugging
        Route::get('/storage-check', function() {
            $storagePath = storage_path('app/public/publications');
            $publicPath = public_path('storage/publications');
            $symlinkPath = public_path('storage');
            
            return [
                'storage' => [
                    'path' => $storagePath,
                    'exists' => file_exists($storagePath),
                    'writable' => is_writable($storagePath),
                    'permissions' => file_exists($storagePath) ? substr(sprintf('%o', fileperms($storagePath)), -4) : 'N/A',
                ],
                'public_storage' => [
                    'path' => $publicPath,
                    'exists' => file_exists($publicPath),
                    'writable' => file_exists($publicPath) ? is_writable($publicPath) : false,
                ],
                'symlink' => [
                    'path' => $symlinkPath,
                    'exists' => file_exists($symlinkPath),
                    'is_link' => is_link($symlinkPath),
                    'target' => is_link($symlinkPath) ? readlink($symlinkPath) : 'Not a symlink',
                ],
            ];
        });
        
        // Publication path debugging
        Route::get('/publication-path', function() {
            if (!auth()->check()) {
                return ['error' => 'Please login first'];
            }
            
            $samplePub = \App\Models\Publication::first();
            
            if (!$samplePub) {
                return ['error' => 'No publications found'];
            }
            
            return [
                'sample_publication' => [
                    'id' => $samplePub->id,
                    'name' => $samplePub->name,
                    'title' => $samplePub->title,
                    'file_path' => $samplePub->file_path,
                    'file_url' => $samplePub->file_url,
                    'year' => $samplePub->year,
                    'month' => $samplePub->month,
                    'day' => $samplePub->day,
                    'page' => $samplePub->page,
                ],
            ];
        });
        
        // Deleted publications debugging
        Route::get('/deleted-publications', function() {
            if (!auth()->check()) {
                return ['error' => 'Please login first'];
            }
            
            try {
                $deletedPublications = [];
                
                if (DB::getSchemaBuilder()->hasTable('deleted_publications')) {
                    $deletedPublications = \App\Models\DeletedPublication::with(['user', 'deletedBy'])
                        ->orderBy('deleted_at', 'desc')
                        ->get()
                        ->map(function ($pub) {
                            return [
                                'id' => $pub->id,
                                'original_id' => $pub->original_id,
                                'title' => $pub->title,
                                'file_path' => $pub->file_path,
                                'file_exists' => Storage::disk('public')->exists($pub->file_path),
                                'deleted_by' => $pub->deletedBy->name ?? 'Unknown',
                                'deleted_at' => $pub->deleted_at->format('Y-m-d H:i:s'),
                            ];
                        });
                }
                
                return [
                    'deleted_publications_count' => count($deletedPublications),
                    'deleted_publications' => $deletedPublications,
                ];
            } catch (\Exception $e) {
                return [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ];
            }
        });
        
        // User permissions debugging
        Route::get('/user-permissions', function() {
            if (!auth()->check()) {
                return ['error' => 'Please login first'];
            }
            
            $user = auth()->user();
            $user->load('role');
            
            return [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'role' => $user->role ? $user->role->name : 'No role assigned',
                'all_permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                'can_delete_publications' => $user->hasPermissionTo('delete publications'),
            ];
        });
        
        // Laravel log viewer
        Route::get('/log', function() {
            $logFile = storage_path('logs/laravel.log');
            if (file_exists($logFile)) {
                return response()->file($logFile, ['Content-Type' => 'text/plain']);
            }
            return 'Log file not found';
        });
        
        // Route cache clearing
        Route::get('/clear-routes', function() {
            try {
                \Illuminate\Support\Facades\Artisan::call('route:clear');
                \Illuminate\Support\Facades\Artisan::call('config:clear');
                
                return [
                    'status' => 'success',
                    'message' => 'Route cache cleared successfully'
                ];
            } catch (\Exception $e) {
                return [
                    'status' => 'error',
                    'message' => 'Failed to clear routes: ' . $e->getMessage()
                ];
            }
        });
    });
}
