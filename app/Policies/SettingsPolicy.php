<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class SettingsPolicy
{
    /**
     * Determine whether the user can view any settings.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('manage settings') || $user->isAdmin();
    }

    /**
     * Determine whether the user can view specific settings.
     */
    public function view(User $user): bool
    {
        return $user->hasPermissionTo('manage settings') || $user->isAdmin();
    }

    /**
     * Determine whether the user can update settings.
     */
    public function update(User $user): bool
    {
        return $user->hasPermissionTo('manage settings') || $user->isAdmin();
    }

    /**
     * Determine whether the user can manage system configuration.
     */
    public function manageSystem(User $user): bool
    {
        return $user->hasPermissionTo('manage settings') || $user->isAdmin();
    }

    /**
     * Determine whether the user can manage application settings.
     */
    public function manageApplication(User $user): bool
    {
        return $user->hasPermissionTo('manage settings') || $user->isAdmin();
    }

    /**
     * Determine whether the user can backup the system.
     */
    public function backup(User $user): bool
    {
        return $user->hasPermissionTo('manage settings') || $user->isAdmin();
    }

    /**
     * Determine whether the user can restore the system.
     */
    public function restore(User $user): bool
    {
        return $user->isAdmin(); // Only admins can restore
    }
}
