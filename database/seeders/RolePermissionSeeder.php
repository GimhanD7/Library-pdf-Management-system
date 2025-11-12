<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User Management
            'view users',
            'create users',
            'edit users',
            'delete users',
            'assign roles',
            
            // Role Management
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
            'assign permissions',
            
            // Publication Management
            'view publications',
            'create publications',
            'edit publications',
            'delete publications',
            'approve publications',
            'publish publications',
            
            // Settings
            'manage settings',
            'view logs',
            'clear cache',
        ];

        foreach ($permissions as $permission) {
            \App\Models\Permission::firstOrCreate([
                'name' => $permission,
                'slug' => str_replace(' ', '_', $permission),
                'module' => $this->getPermissionModule($permission)
            ]);
        }

        // Create roles and assign created permissions
        
        // Super Admin - gets all permissions
        $superAdmin = \App\Models\Role::firstOrCreate([
            'name' => 'Super Admin',
            'slug' => 'super-admin',
            'description' => 'Has full access to all features',
            'is_default' => false
        ]);
        $superAdmin->syncPermissions(\App\Models\Permission::all());

        // Admin - gets most permissions
        $admin = \App\Models\Role::firstOrCreate([
            'name' => 'Admin',
            'slug' => 'admin',
            'description' => 'Has access to most features',
            'is_default' => false
        ]);
        
        $adminPermissions = \App\Models\Permission::whereNotIn('slug', [
            'delete_roles',
            'assign_roles',
            'assign_permissions'
        ])->get();
        
        $admin->syncPermissions($adminPermissions);

        // Editor - can manage publications
        $editor = \App\Models\Role::firstOrCreate([
            'name' => 'Editor',
            'slug' => 'editor',
            'description' => 'Can manage publications',
            'is_default' => false
        ]);
        
        $editor->syncPermissions([
            'view_publications',
            'create_publications',
            'edit_publications',
            'publish_publications'
        ]);

        // Author - can create and manage own publications
        $author = \App\Models\Role::firstOrCreate([
            'name' => 'Author',
            'slug' => 'author',
            'description' => 'Can create and manage own publications',
            'is_default' => false
        ]);
        
        $author->syncPermissions([
            'view_publications',
            'create_publications',
            'edit_publications',
        ]);

        // User - default role
        $user = \App\Models\Role::firstOrCreate([
            'name' => 'User',
            'slug' => 'user',
            'description' => 'Regular authenticated user',
            'is_default' => true
        ]);
        
        $user->syncPermissions([
            'view_publications'
        ]);
        
        // Assign Super Admin role to the first user (if exists)
        $firstUser = \App\Models\User::first();
        if ($firstUser) {
            $firstUser->assignRole('super-admin');
        }
    }
    
    /**
     * Get the module name for a permission
     *
     * @param string $permission
     * @return string
     */
    private function getPermissionModule(string $permission): string
    {
        if (str_contains($permission, 'user')) {
            return 'Users';
        }
        
        if (str_contains($permission, 'role') || str_contains($permission, 'permission')) {
            return 'Roles & Permissions';
        }
        
        if (str_contains($permission, 'publication')) {
            return 'Publications';
        }
        
        if (str_contains($permission, 'setting') || 
            str_contains($permission, 'log') || 
            str_contains($permission, 'cache')) {
            return 'System';
        }
        
        return 'Other';
    }
}
