<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // User Management
            [
                'name' => 'view users',
                'description' => 'View user list and details',
                'group' => 'user_management',
            ],
            [
                'name' => 'create users',
                'description' => 'Create new users',
                'group' => 'user_management',
            ],
            [
                'name' => 'edit users',
                'description' => 'Edit existing users',
                'group' => 'user_management',
            ],
            [
                'name' => 'delete users',
                'description' => 'Delete users',
                'group' => 'user_management',
            ],

            // Role & Permissions
            [
                'name' => 'view roles',
                'description' => 'View role list and details',
                'group' => 'role_management',
            ],
            [
                'name' => 'create roles',
                'description' => 'Create new roles',
                'group' => 'role_management',
            ],
            [
                'name' => 'edit roles',
                'description' => 'Edit existing roles',
                'group' => 'role_management',
            ],
            [
                'name' => 'delete roles',
                'description' => 'Delete roles',
                'group' => 'role_management',
            ],

            // Publications
            [
                'name' => 'view publications',
                'description' => 'View publication list and details',
                'group' => 'publication_management',
            ],
            [
                'name' => 'create publications',
                'description' => 'Create new publications',
                'group' => 'publication_management',
            ],
            [
                'name' => 'edit publications',
                'description' => 'Edit existing publications',
                'group' => 'publication_management',
            ],
            [
                'name' => 'delete publications',
                'description' => 'Delete publications',
                'group' => 'publication_management',
            ],

            // Settings
            [
                'name' => 'manage settings',
                'description' => 'Manage application settings',
                'group' => 'settings',
            ],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['name' => $permission['name']],
                $permission
            );
        }
    }
}
