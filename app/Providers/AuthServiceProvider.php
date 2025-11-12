<?php

namespace App\Providers;

use App\Models\Publication;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use App\Policies\PublicationPolicy;
use App\Policies\RolePolicy;
use App\Policies\PermissionPolicy;
use App\Policies\UserPolicy;
use App\Policies\SettingsPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Publication::class => PublicationPolicy::class,
        Role::class => RolePolicy::class,
        Permission::class => PermissionPolicy::class,
        User::class => UserPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Define custom gates for settings management
        Gate::define('manage-settings', function (User $user) {
            return $user->hasPermissionTo('manage settings') || $user->isAdmin();
        });

        // Define gate for viewing admin dashboard
        Gate::define('view-admin-dashboard', function (User $user) {
            return $user->hasAnyPermission([
                'view users', 'create users', 'edit users', 'delete users',
                'view roles', 'create roles', 'edit roles', 'delete roles',
                'manage settings'
            ]) || $user->isAdmin();
        });

        // Define gate for accessing admin panel
        Gate::define('access-admin-panel', function (User $user) {
            return $user->hasAnyPermission([
                'view users', 'create users', 'edit users', 'delete users',
                'view roles', 'create roles', 'edit roles', 'delete roles',
                'manage settings'
            ]) || $user->isAdmin();
        });

        // Define gate for system administration
        Gate::define('system-admin', function (User $user) {
            return $user->isAdmin();
        });
    }
}
