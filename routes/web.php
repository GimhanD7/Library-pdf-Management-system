<?php

/**
 * Web Routes
 * 
 * This file contains all web routes for the application.
 * Routes are organized into logical groups for better maintainability.
 * 
 * @package Library Management System
 */

use App\Http\Controllers\SidebarController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\PublicationController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
|
| Routes accessible without authentication
|
*/

// Welcome page
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Authentication routes
Route::get('/login', [LoginController::class, 'create'])->name('login');
Route::post('/login', [LoginController::class, 'store']);

/*
|--------------------------------------------------------------------------
| PDF Serving Routes
|--------------------------------------------------------------------------
|
| Routes for serving PDF files securely
|
*/

// PDF.js worker file
Route::get('/js/pdf.worker.js', function() {
    $workerPath = base_path('node_modules/pdfjs-dist/legacy/build/pdf.worker.js');
    
    if (!\Illuminate\Support\Facades\File::exists($workerPath)) {
        return response('PDF.js worker file not found', 404);
    }
    
    return response()->file($workerPath, [
        'Content-Type' => 'application/javascript',
        'Cache-Control' => 'public, max-age=31536000',
        'Access-Control-Allow-Origin' => '*'
    ]);
});

// Secure PDF token generation (requires authentication)
Route::post('/api/pdf/generate-token', [PdfController::class, 'generateToken'])
    ->middleware('auth')
    ->name('pdf.generate.token');

// Secure PDF viewing with token
Route::get('/pdf/view/{token}', [PdfController::class, 'serveSecure'])
    ->name('pdf.view.secure');

// PDF serving route
Route::get('/storage/publications/{name}/{year}/{month}/{day}/{filename}', [PdfController::class, 'servePdf'])
    ->where('filename', '.*\.pdf$')
    ->name('pdf.serve');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
|
| Routes that require user authentication
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    Route::get('/dashboard/statistics', [DashboardController::class, 'getStatistics'])
        ->name('dashboard.statistics');
    
    // Report generation
    Route::get('/reports/generate', [\App\Http\Controllers\ReportController::class, 'generate']);
    
    // File download
    Route::get('/file/{id}', [PublicationController::class, 'download'])
        ->name('publication.file');
    
    // Sidebar toggle
    Route::post('/sidebar/toggle', [SidebarController::class, 'toggle'])
        ->name('sidebar.toggle');
    
    /*
    |--------------------------------------------------------------------------
    | Publications Routes
    |--------------------------------------------------------------------------
    |
    | Routes for managing publications with permission-based access
    |
    */
    
    Route::prefix('publications')->group(function () {
        
        // List publications (permission-based access)
        Route::get('/', function () {
            // Permission check (admins typically have all permissions)
            $user = auth()->user();
            if (!$user->hasPermissionTo('view publications') && !$user->isAdmin()) {
                abort(403, 'You do not have permission to view publications.');
            }
            
            // Base query
            $query = \App\Models\Publication::query()
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->orderBy('day', 'desc');

            // Search filter
            $search = request('search');
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('file_path', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('original_filename', 'like', "%{$search}%");
                });
            }

            // Pagination with sane bounds
            $perPage = (int) request('per_page', 50);
            $perPage = max(1, min($perPage, 100));
            $paginated = $query->paginate($perPage)->withQueryString();

            $publications = $paginated->map(function ($pub) {
                return [
                    'id' => $pub->id,
                    'name' => $pub->month,
                    'title' => $pub->title,
                    'code' => $pub->code,
                    'description' => $pub->description,
                    'original_filename' => $pub->original_filename,
                    'file_path' => $pub->file_path,
                    'file_url' => Storage::disk('public')->url($pub->file_path),
                    'mime_type' => $pub->mime_type,
                    'file_size' => $pub->file_size,
                    'year' => $pub->year,
                    'month' => $pub->month,
                    'day' => $pub->day,
                    'page' => $pub->page,
                    'user_id' => $pub->user_id,
                    'created_at' => $pub->created_at,
                    'updated_at' => $pub->updated_at,
                    'type' => 'Periodical',
                    'is_disabled' => false,
                    'is_valid' => true
                ];
            });

            return Inertia::render('publications/Publications', [
                'publications' => [
                    'data' => $publications,
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                    'links' => $paginated->links(),
                ],
                'filters' => request()->only(['search', 'per_page']),
                'canUpload' => $user->hasPermissionTo('create publications') || $user->isAdmin()
            ]);
        })->name('publications');

        // View PDF in browser (controller mapping)
        Route::get('view-pdf/{id}', [PublicationController::class, 'view'])
            ->name('publications.view');
    });
    
    // Create publication form
    Route::get('/publications/create', [PublicationController::class, 'create'])
        ->middleware('permission:create publications')
        ->name('publications.create');
    
    // Publication management routes (requires create permission)
    Route::prefix('publications')->middleware(['permission:create publications'])->group(function () {
        Route::post('/upload', [PublicationController::class, 'uploadFile'])
            ->name('publications.upload');
        Route::post('/', [PublicationController::class, 'store'])
            ->name('publications.store');
        Route::get('/check/{filename}', [PublicationController::class, 'checkFile'])
            ->name('publications.check');
        Route::post('/bulk', [PublicationController::class, 'bulkStore'])
            ->name('publications.bulk-store');
    });
    
    // Delete publication (requires delete permission)
    Route::delete('/publications/{publication}', [PublicationController::class, 'destroy'])
        ->name('publications.destroy');
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Routes for administrative functions with permission-based access
|
*/

Route::middleware(['web', 'auth'])
    ->prefix('admin')
    ->as('admin.')
    ->group(function () {
        
        // Dashboard
        Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])
            ->name('dashboard');
            
        // Activities
        Route::prefix('activities')->name('activities.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\ActivitiesController::class, 'index'])
                ->name('index');
            Route::get('/export/csv', [\App\Http\Controllers\Admin\ActivitiesController::class, 'exportCsv'])
                ->name('export.csv');
            Route::get('/export/pdf', [\App\Http\Controllers\Admin\ActivitiesController::class, 'exportPdf'])
                ->name('export.pdf');
        });
            
        // Users management
        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', [\App\Http\Controllers\UserController::class, 'index'])
                ->middleware('permission:view users')
                ->name('index');
            Route::get('/create', [\App\Http\Controllers\UserController::class, 'create'])
                ->middleware('permission:create users')
                ->name('create');
            Route::post('/', [\App\Http\Controllers\UserController::class, 'store'])
                ->middleware('permission:create users')
                ->name('store');
            Route::get('/{user}/edit', [\App\Http\Controllers\UserController::class, 'edit'])
                ->middleware('permission:edit users')
                ->name('edit');
            Route::put('/{user}', [\App\Http\Controllers\UserController::class, 'update'])
                ->middleware('permission:edit users')
                ->name('update');
            Route::delete('/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])
                ->middleware('permission:delete users')
                ->name('destroy');
        });
        
        // Role management
        Route::prefix('roles')->name('roles.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\RoleController::class, 'index'])
                ->middleware('permission:view roles')
                ->name('index');
            Route::get('/create', [\App\Http\Controllers\Admin\RoleController::class, 'create'])
                ->middleware('permission:create roles')
                ->name('create');
            Route::post('/', [\App\Http\Controllers\Admin\RoleController::class, 'store'])
                ->middleware('permission:create roles')
                ->name('store');
            Route::get('/{role}/edit', [\App\Http\Controllers\Admin\RoleController::class, 'edit'])
                ->middleware('permission:edit roles')
                ->name('edit');
            Route::put('/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'update'])
                ->middleware('permission:edit roles')
                ->name('update');
            Route::delete('/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'destroy'])
                ->middleware('permission:delete roles')
                ->name('destroy');
        });

        // Permission management
        Route::prefix('permissions')->name('permissions.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\PermissionController::class, 'index'])
                ->middleware('permission:view roles')
                ->name('index');
            Route::get('/stats', [\App\Http\Controllers\Admin\PermissionController::class, 'stats'])
                ->middleware('permission:view roles')
                ->name('stats');
        });

        // Publications verification
        Route::prefix('publications')->name('publications.')->group(function () {
            Route::get('/pending', [PublicationController::class, 'pendingVerification'])
                ->name('pending');
            Route::post('/approve/{tempPublication}', [PublicationController::class, 'approve'])
                ->name('approve');
            Route::post('/reject/{tempPublication}', [PublicationController::class, 'reject'])
                ->name('reject');
            Route::post('/revert/{tempPublication}', [PublicationController::class, 'revert'])
                ->name('revert');
            Route::get('/history', [PublicationController::class, 'verificationHistory'])
                ->name('history');
            Route::get('/view-temp/{tempPublication}', [PublicationController::class, 'viewTemp'])
                ->name('view-temp');
                
            // Deleted publications management (admin only)
            Route::get('/deleted', [PublicationController::class, 'deletedPublications'])
                ->name('deleted');
            Route::post('/deleted/{id}/restore', [PublicationController::class, 'restoreDeleted'])
                ->name('deleted.restore');
            Route::delete('/deleted/{id}', [PublicationController::class, 'permanentlyDelete'])
                ->name('deleted.destroy');
        });

        // Settings management
        Route::prefix('settings')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\SettingsController::class, 'index'])
                ->name('index');
            Route::put('/', [\App\Http\Controllers\Admin\SettingsController::class, 'update'])
                ->name('update');
            Route::post('/clear-cache', [\App\Http\Controllers\Admin\SettingsController::class, 'clearCache'])
                ->name('clear-cache');
            Route::post('/optimize', [\App\Http\Controllers\Admin\SettingsController::class, 'optimize'])
                ->name('optimize');
            Route::post('/storage-link', [\App\Http\Controllers\Admin\SettingsController::class, 'createStorageLink'])
                ->name('storage-link');
            Route::post('/migrate', [\App\Http\Controllers\Admin\SettingsController::class, 'migrate'])
                ->name('migrate');
            Route::get('/system-info', [\App\Http\Controllers\Admin\SettingsController::class, 'systemInfo'])
                ->name('system-info');
        });
    });

/*
|--------------------------------------------------------------------------
| Additional Route Files
|--------------------------------------------------------------------------
|
| Load additional route files for better organization
|
*/

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/test-permissions.php';

// Load debug and setup routes only in local environment
if (app()->environment('local')) {
    if (file_exists(__DIR__.'/debug.php')) {
        require __DIR__.'/debug.php';
    }
    if (file_exists(__DIR__.'/setup.php')) {
        require __DIR__.'/setup.php';
    }
}
