<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions
        $this->call([
            PermissionSeeder::class,
            RolePermissionSeeder::class,
        ]);

        // Create admin user if not exists
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        // Assign super-admin role
        if (!$admin->hasRole('super-admin')) {
            $admin->assignRole('super-admin');
        }

        // Create some test users with different roles
        $roles = ['admin', 'editor', 'author', 'user'];
        
        foreach ($roles as $role) {
            $user = User::factory()->create([
                'name' => ucfirst($role) . ' User',
                'email' => $role . '@example.com',
                'password' => bcrypt('password'),
            ]);
            
            $user->assignRole($role);
        }
    }
}
