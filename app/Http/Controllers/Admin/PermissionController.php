<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * Display a listing of permissions.
     */
    public function index()
    {
        // Check if user has permission to view permissions
        if (!auth()->user()->hasPermissionTo('view roles') && !auth()->user()->isAdmin()) {
            abort(403, 'You do not have permission to view permissions.');
        }

        $permissions = Permission::all(['id', 'name', 'description', 'group'])
            ->groupBy('group')
            ->map(function ($groupPermissions) {
                return $groupPermissions->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'description' => $permission->description,
                        'group' => $permission->group,
                    ];
                });
            });

        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_default' => $role->is_default,
                'users_count' => $role->users()->count(),
                'permissions' => $role->permissions->pluck('id')->toArray(),
            ];
        });

        return inertia('Admin/Permissions/Index', [
            'permissions' => $permissions,
            'roles' => $roles
        ]);
    }

    /**
     * Get permission statistics
     */
    public function stats()
    {
        $totalPermissions = Permission::count();
        $totalRoles = Role::count();
        $permissionGroups = Permission::distinct('group')->count('group');
        
        $rolePermissionCounts = Role::withCount('permissions')->get()->map(function ($role) {
            return [
                'role' => $role->name,
                'permissions_count' => $role->permissions_count,
            ];
        });

        return response()->json([
            'total_permissions' => $totalPermissions,
            'total_roles' => $totalRoles,
            'permission_groups' => $permissionGroups,
            'role_permission_counts' => $rolePermissionCounts,
        ]);
    }
}
