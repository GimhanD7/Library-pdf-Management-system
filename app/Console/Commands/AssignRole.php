<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class AssignRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:assign-role {email : The email of the user} {role : The role to assign (admin, librarian, user)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign a role to a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $roleSlug = strtolower($this->argument('role'));

        // Find the user
        $user = \App\Models\User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        // Find the role
        $role = \App\Models\Role::where('slug', $roleSlug)->first();

        if (!$role) {
            $this->error("Role '{$roleSlug}' not found. Available roles: admin, librarian, user");
            return 1;
        }

        // Assign the role
        $user->assignRole($roleSlug);

        $this->info("Successfully assigned '{$role->name}' role to '{$user->name}' ({$user->email})");
        return 0;
    }
}
