<?php

/**
 * Setup Routes
 * 
 * These routes are for initial system setup and should be removed after deployment.
 * They create tables and configure permissions.
 * 
 * SECURITY WARNING: Remove this file in production or protect with strong authentication.
 */

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;

// Only enable setup routes in local environment
if (app()->environment('local')) {
    
    Route::prefix('setup')->middleware('auth')->group(function () {
        
        // Create deleted_publications table
        Route::get('/deleted-publications-table', function() {
            try {
                if (DB::getSchemaBuilder()->hasTable('deleted_publications')) {
                    return [
                        'status' => 'info',
                        'message' => 'deleted_publications table already exists'
                    ];
                }

                DB::getSchemaBuilder()->create('deleted_publications', function ($table) {
                    $table->id();
                    $table->unsignedBigInteger('original_id');
                    $table->string('name')->nullable();
                    $table->string('title')->nullable();
                    $table->string('code')->nullable();
                    $table->text('description')->nullable();
                    $table->string('original_filename');
                    $table->string('file_path');
                    $table->string('file_url');
                    $table->string('mime_type');
                    $table->unsignedBigInteger('file_size');
                    $table->unsignedInteger('year');
                    $table->unsignedTinyInteger('month')->nullable();
                    $table->unsignedTinyInteger('day')->nullable();
                    $table->unsignedInteger('page')->nullable();
                    $table->string('type')->nullable();
                    $table->unsignedBigInteger('user_id');
                    $table->boolean('is_disabled')->default(false);
                    $table->boolean('is_valid')->default(true);
                    $table->unsignedBigInteger('deleted_by');
                    $table->string('deleted_reason')->nullable();
                    $table->timestamp('original_created_at');
                    $table->timestamp('original_updated_at');
                    $table->timestamp('deleted_at');
                    $table->timestamps();

                    $table->index('original_id');
                    $table->index('user_id');
                    $table->index('deleted_by');
                    $table->index('deleted_at');
                    $table->index(['year', 'month', 'day']);
                    $table->index('name');

                    $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                    $table->foreign('deleted_by')->references('id')->on('users')->onDelete('cascade');
                });

                return [
                    'status' => 'success',
                    'message' => 'deleted_publications table created successfully'
                ];
            } catch (\Exception $e) {
                return [
                    'status' => 'error',
                    'message' => 'Failed to create deleted_publications table',
                    'error' => $e->getMessage()
                ];
            }
        });
        
        // Create temp_publications table
        Route::get('/temp-publications-table', function() {
            try {
                if (DB::getSchemaBuilder()->hasTable('temp_publications')) {
                    return [
                        'status' => 'info',
                        'message' => 'temp_publications table already exists'
                    ];
                }

                DB::getSchemaBuilder()->create('temp_publications', function ($table) {
                    $table->id();
                    $table->string('name')->nullable();
                    $table->string('title')->nullable();
                    $table->text('description')->nullable();
                    $table->string('original_filename');
                    $table->string('file_path');
                    $table->string('file_url')->nullable();
                    $table->string('mime_type')->nullable();
                    $table->bigInteger('file_size')->nullable();
                    $table->integer('year')->nullable();
                    $table->integer('month')->nullable();
                    $table->integer('day')->nullable();
                    $table->integer('page')->nullable();
                    $table->foreignId('user_id')->constrained()->onDelete('cascade');
                    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                    $table->text('admin_notes')->nullable();
                    $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
                    $table->timestamp('verified_at')->nullable();
                    $table->timestamps();

                    $table->index(['status', 'created_at']);
                    $table->index(['user_id', 'status']);
                    $table->index('verified_by');
                });

                return [
                    'status' => 'success',
                    'message' => 'temp_publications table created successfully'
                ];
            } catch (\Exception $e) {
                return [
                    'status' => 'error',
                    'message' => 'Failed to create temp_publications table',
                    'error' => $e->getMessage()
                ];
            }
        });
        
        // Setup system permissions
        Route::get('/permissions', function() {
            try {
                if (!DB::getSchemaBuilder()->hasTable('permissions')) {
                    return [
                        'status' => 'error',
                        'message' => 'Permissions table does not exist. Run migrations first.'
                    ];
                }
                
                $systemPermissions = [
                    // User Management
                    ['name' => 'view users', 'description' => 'View user list and details', 'group' => 'user_management'],
                    ['name' => 'create users', 'description' => 'Create new users', 'group' => 'user_management'],
                    ['name' => 'edit users', 'description' => 'Edit existing users', 'group' => 'user_management'],
                    ['name' => 'delete users', 'description' => 'Delete users', 'group' => 'user_management'],
                    
                    // Role Management
                    ['name' => 'view roles', 'description' => 'View role list and details', 'group' => 'role_management'],
                    ['name' => 'create roles', 'description' => 'Create new roles', 'group' => 'role_management'],
                    ['name' => 'edit roles', 'description' => 'Edit existing roles', 'group' => 'role_management'],
                    ['name' => 'delete roles', 'description' => 'Delete roles', 'group' => 'role_management'],
                    
                    // Publication Management
                    ['name' => 'view publications', 'description' => 'View publication list and details', 'group' => 'publication_management'],
                    ['name' => 'create publications', 'description' => 'Create new publications', 'group' => 'publication_management'],
                    ['name' => 'edit publications', 'description' => 'Edit existing publications', 'group' => 'publication_management'],
                    ['name' => 'delete publications', 'description' => 'Delete publications', 'group' => 'publication_management'],
                    
                    // Settings
                    ['name' => 'manage settings', 'description' => 'Manage application settings', 'group' => 'settings'],
                ];
                
                $created = [];
                $existing = [];
                
                foreach ($systemPermissions as $permData) {
                    $permission = \App\Models\Permission::firstOrCreate(
                        ['name' => $permData['name']],
                        [
                            'slug' => str_replace(' ', '-', $permData['name']),
                            'description' => $permData['description'] ?? null,
                            'group' => $permData['group'] ?? null,
                        ]
                    );
                    
                    if ($permission->wasRecentlyCreated) {
                        $created[] = $permData['name'];
                    } else {
                        $existing[] = $permData['name'];
                    }
                }
                
                return [
                    'status' => 'success',
                    'message' => 'System permissions setup complete',
                    'summary' => [
                        'created' => count($created),
                        'existing' => count($existing),
                        'total' => count($systemPermissions)
                    ],
                    'details' => [
                        'created' => $created,
                        'existing' => $existing
                    ]
                ];
            } catch (\Exception $e) {
                return [
                    'status' => 'error',
                    'message' => 'Failed to setup permissions',
                    'error' => $e->getMessage()
                ];
            }
        });
        
        // Grant all permissions to admin role
        Route::get('/admin-permissions', function() {
            try {
                $adminRole = \App\Models\Role::where('slug', 'admin')
                    ->orWhere('name', 'admin')
                    ->first();
                
                if (!$adminRole) {
                    return [
                        'status' => 'error',
                        'message' => 'Admin role not found'
                    ];
                }
                
                $allPermissions = \App\Models\Permission::all();
                $granted = [];
                
                foreach ($allPermissions as $permission) {
                    if (!$adminRole->hasPermissionTo($permission->name)) {
                        $adminRole->givePermissionTo($permission->name);
                        $granted[] = $permission->name;
                    }
                }
                
                \Illuminate\Support\Facades\Cache::flush();
                
                return [
                    'status' => 'success',
                    'message' => 'Admin granted all permissions',
                    'newly_granted' => $granted,
                    'total_permissions' => $allPermissions->count()
                ];
            } catch (\Exception $e) {
                return [
                    'status' => 'error',
                    'message' => 'Failed to setup admin permissions',
                    'error' => $e->getMessage()
                ];
            }
        });
        
        // Grant standard permissions to librarian role
        Route::get('/librarian-permissions', function() {
            try {
                $librarianRole = \App\Models\Role::where('slug', 'librarian')
                    ->orWhere('name', 'librarian')
                    ->first();
                
                if (!$librarianRole) {
                    return [
                        'status' => 'error',
                        'message' => 'Librarian role not found'
                    ];
                }
                
                $librarianPermissions = [
                    'view users',
                    'view publications',
                    'create publications',
                    'edit publications',
                    'delete publications',
                ];
                
                $granted = [];
                
                foreach ($librarianPermissions as $permissionName) {
                    $permission = \App\Models\Permission::firstOrCreate(
                        ['name' => $permissionName],
                        ['slug' => str_replace(' ', '-', $permissionName)]
                    );
                    
                    if (!$librarianRole->hasPermissionTo($permissionName)) {
                        $librarianRole->givePermissionTo($permissionName);
                        $granted[] = $permissionName;
                    }
                }
                
                \Illuminate\Support\Facades\Cache::flush();
                
                return [
                    'status' => 'success',
                    'message' => 'Librarian permissions setup complete',
                    'newly_granted' => $granted,
                    'all_permissions' => $librarianRole->fresh()->permissions->pluck('name')->toArray()
                ];
            } catch (\Exception $e) {
                return [
                    'status' => 'error',
                    'message' => 'Failed to setup librarian permissions',
                    'error' => $e->getMessage()
                ];
            }
        });
        
        // Fix storage access
        Route::get('/storage-link', function() {
            try {
                $publicPath = public_path('storage');
                $storagePath = storage_path('app/public');
                
                $linkExists = is_link($publicPath) || is_dir($publicPath);
                
                if (!$linkExists) {
                    if (function_exists('symlink')) {
                        symlink($storagePath, $publicPath);
                        $message = 'Storage symlink created successfully!';
                    } else {
                        $message = 'Symlink not available. Use direct file serving route instead.';
                    }
                } else {
                    $message = 'Storage link already exists.';
                }
                
                return [
                    'status' => 'success',
                    'message' => $message,
                    'paths' => [
                        'public_storage' => $publicPath,
                        'storage_path' => $storagePath,
                        'link_exists' => $linkExists,
                    ]
                ];
            } catch (\Exception $e) {
                return [
                    'status' => 'error',
                    'message' => 'Failed to create storage link',
                    'error' => $e->getMessage()
                ];
            }
        });
    });
}
