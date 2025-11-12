<?php

namespace App\Traits;

use App\Models\Permission;
use App\Models\Role;

trait HasPermissions
{
    /**
     * Check if the user has a specific permission.
     *
     * @param string $permission
     * @return bool
     */
    public function can($permission): bool
    {
        return $this->hasPermissionTo($permission);
    }

    /**
     * Check if the user cannot perform a specific permission.
     *
     * @param string $permission
     * @return bool
     */
    public function cannot($permission): bool
    {
        return !$this->can($permission);
    }

    /**
     * Get all permissions for the user through their role.
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllPermissions()
    {
        if (!$this->role) {
            return collect();
        }

        return $this->role->permissions;
    }

    /**
     * Get permission names for the user.
     *
     * @return array
     */
    public function getPermissionNames(): array
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * Check if user has direct permission (through role).
     *
     * @param string $permission
     * @return bool
     */
    public function hasDirectPermission($permission): bool
    {
        if (!$this->role) {
            return false;
        }

        return $this->role->permissions()
            ->where('name', $permission)
            ->exists();
    }

    /**
     * Check if user has permission via role.
     *
     * @param string $permission
     * @return bool
     */
    public function hasPermissionViaRole($permission): bool
    {
        return $this->hasDirectPermission($permission);
    }
}
