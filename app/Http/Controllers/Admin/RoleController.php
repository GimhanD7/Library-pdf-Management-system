<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index()
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::withCount('users')
            ->latest()
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'description' => $role->description,
                    'is_default' => (bool) $role->is_default,
                    'users_count' => $role->users_count,
                    'created_at' => $role->created_at,
                    'updated_at' => $role->updated_at,
                ];
            });

        return inertia('Admin/Roles/Index', [
            'roles' => $roles
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create()
    {
        $this->authorize('create', Role::class);

        $permissions = Permission::all(['id', 'name', 'description', 'group'])
            ->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'description' => $permission->description,
                    'group' => $permission->group ?? 'Other',
                ];
            });

        return inertia('Admin/Roles/Create', [
            'permissions' => $permissions
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Role::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'slug' => 'required|string|max:255|unique:roles,slug',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        return DB::transaction(function () use ($validated) {
            // If this is set as default, unset other defaults
            if ($validated['is_default'] ?? false) {
                Role::where('is_default', true)->update(['is_default' => false]);
            }

            $role = Role::create([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'description' => $validated['description'] ?? null,
                'is_default' => $validated['is_default'] ?? false,
            ]);

            // Sync permissions if provided
            if (isset($validated['permissions'])) {
                $role->permissions()->sync($validated['permissions']);
            }

            return redirect()
                ->route('admin.roles.index')
                ->with('success', 'Role created successfully');
        });
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role)
    {
        $this->authorize('update', $role);

        // Load users with their roles
        $users = $role->users()->with('role')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at->format('M d, Y'),
                'role' => $user->role ? [
                    'name' => $user->role->name,
                    'slug' => $user->role->slug
                ] : null,
            ];
        });

        // Get all permissions
        $permissions = Permission::all(['id', 'name', 'description', 'group'])
            ->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'description' => $permission->description,
                    'group' => $permission->group ?? 'Other',
                ];
            });

        // Get role's current permissions
        $rolePermissions = $role->permissions()->pluck('permissions.id')->toArray();

        return inertia('Admin/Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_default' => $role->is_default,
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
                'users' => $users,
                'permissions' => $rolePermissions
            ],
            'permissions' => $permissions
        ]);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, Role $role)
    {
        $this->authorize('update', $role);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'slug' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        try {
            DB::beginTransaction();
            
            // If this is set as default, unset other defaults
            if ($validated['is_default'] ?? false) {
                Role::where('is_default', true)
                    ->where('id', '!=', $role->id)
                    ->update(['is_default' => false]);
            }

            $role->update([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'description' => $validated['description'] ?? null,
                'is_default' => $validated['is_default'] ?? false,
            ]);

            // Sync permissions if provided
            if (isset($validated['permissions'])) {
                $role->permissions()->sync($validated['permissions']);
            }
            
            DB::commit();

            return back()->with([
                'flash' => [
                    'success' => 'Role updated successfully',
                ],
            ]);
                
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with([
                'flash' => [
                    'error' => 'Failed to update role: ' . $e->getMessage(),
                ],
            ]);
        }
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role)
    {
        $this->authorize('delete', $role);

        try {
            // Prevent deletion of default role
            if ($role->is_default) {
                return back()->with('error', 'Cannot delete the default role');
            }

            // Prevent deletion if role has users
            if ($role->users()->exists()) {
                return back()->with('error', 'Cannot delete role with assigned users');
            }

            $role->delete();

            return redirect()->route('admin.roles.index')
                ->with('success', 'Role deleted successfully');
                
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete role: ' . $e->getMessage());
        }
    }
}
