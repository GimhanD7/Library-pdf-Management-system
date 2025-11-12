<?php

use Illuminate\Support\Facades\Route;

// Simple test route to check basic functionality
Route::get('/test-basic', function () {
    if (!auth()->check()) {
        return 'Please login first';
    }
    
    $user = auth()->user();
    
    return [
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_admin' => method_exists($user, 'isAdmin') ? $user->isAdmin() : false,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'slug' => $user->role->slug,
            ] : null,
        ],
        'tables' => [
            'users_table' => \DB::getSchemaBuilder()->hasTable('users'),
            'roles_table' => \DB::getSchemaBuilder()->hasTable('roles'),
            'permissions_table' => \DB::getSchemaBuilder()->hasTable('permissions'),
            'permission_role_table' => \DB::getSchemaBuilder()->hasTable('permission_role'),
        ]
    ];
})->middleware('auth');

// Test route to check permission system
Route::get('/test-permissions', function () {
    if (!auth()->check()) {
        return 'Please login first';
    }
    
    $user = auth()->user();
    
    // Check if permissions table exists
    try {
        $permissionsExist = \DB::getSchemaBuilder()->hasTable('permissions');
        $permissionRoleExists = \DB::getSchemaBuilder()->hasTable('permission_role');
        
        if (!$permissionsExist) {
            return [
                'error' => 'Permissions table does not exist',
                'solution' => 'Run: php artisan migrate'
            ];
        }
        
        if (!$permissionRoleExists) {
            return [
                'error' => 'Permission_role table does not exist',
                'solution' => 'Run: php artisan migrate'
            ];
        }
        
        $permissionCount = \App\Models\Permission::count();
        
        if ($permissionCount === 0) {
            return [
                'error' => 'No permissions found in database',
                'solution' => 'Run: php artisan db:seed --class=PermissionSeeder'
            ];
        }
        
        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => $user->isAdmin(),
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                    'slug' => $user->role->slug,
                ] : null,
            ],
            'permissions' => [
                'total_permissions' => $permissionCount,
                'user_permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                'can_view_users' => $user->hasPermissionTo('view users'),
                'can_create_users' => $user->hasPermissionTo('create users'),
                'can_edit_users' => $user->hasPermissionTo('edit users'),
                'can_delete_users' => $user->hasPermissionTo('delete users'),
                'can_view_roles' => $user->hasPermissionTo('view roles'),
                'can_create_roles' => $user->hasPermissionTo('create roles'),
                'can_edit_roles' => $user->hasPermissionTo('edit roles'),
                'can_delete_roles' => $user->hasPermissionTo('delete roles'),
            ],
            'tables_status' => [
                'permissions_table_exists' => $permissionsExist,
                'permission_role_table_exists' => $permissionRoleExists,
                'permissions_count' => $permissionCount,
                'roles_count' => \App\Models\Role::count(),
            ]
        ];
        
    } catch (\Exception $e) {
        return [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ];
    }
})->middleware('auth');

// Debug route to check available methods
Route::get('/debug-methods', function () {
    if (!auth()->check()) {
        return 'Please login first';
    }
    
    $user = auth()->user();
    
    return [
        'user_class' => get_class($user),
        'available_methods' => get_class_methods($user),
        'has_hasPermission' => method_exists($user, 'hasPermission'),
        'has_hasPermissionTo' => method_exists($user, 'hasPermissionTo'),
        'has_getAllPermissions' => method_exists($user, 'getAllPermissions'),
        'has_isAdmin' => method_exists($user, 'isAdmin'),
    ];
})->middleware('auth');

// Debug route to check settings permissions
Route::get('/debug-settings-permission', function () {
    if (!auth()->check()) {
        return 'Please login first';
    }
    
    $user = auth()->user();
    
    try {
        return [
            'user_info' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'role_info' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'slug' => $user->role->slug,
            ] : null,
            'permission_checks' => [
                'isAdmin' => method_exists($user, 'isAdmin') ? $user->isAdmin() : 'Method not found',
                'hasPermissionTo_manage_settings' => method_exists($user, 'hasPermissionTo') ? $user->hasPermissionTo('manage settings') : 'Method not found',
                'hasAnyPermission' => method_exists($user, 'hasAnyPermission') ? $user->hasAnyPermission(['manage settings']) : 'Method not found',
            ],
            'gate_checks' => [
                'manage-settings' => \Gate::allows('manage-settings'),
                'view-admin-dashboard' => \Gate::allows('view-admin-dashboard'),
                'access-admin-panel' => \Gate::allows('access-admin-panel'),
            ],
            'permissions_table_exists' => \DB::getSchemaBuilder()->hasTable('permissions'),
            'user_permissions' => method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name')->toArray() : 'Method not found',
        ];
    } catch (\Exception $e) {
        return [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ];
    }
})->middleware('auth');
