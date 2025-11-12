<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_default'
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * The users that belong to the role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }

    /**
     * The permissions that belong to the role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role')
            ->withTimestamps();
    }
    
    /**
     * Assign permissions to the role.
     *
     * @param array|string|int|Permission $permissions
     * @return array
     */
    public function givePermissionTo($permissions): array
    {
        $permissions = $this->getStoredPermissions($permissions);
        
        if ($permissions->isEmpty()) {
            return [];
        }
        
        $this->permissions()->syncWithoutDetaching($permissions);
        
        return $permissions->pluck('id')->toArray();
    }
    
    /**
     * Revoke permissions from the role.
     *
     * @param array|string|int|Permission $permissions
     * @return int
     */
    public function revokePermissionTo($permissions): int
    {
        $permissions = $this->getStoredPermissions($permissions);
        
        return $this->permissions()->detach($permissions);
    }
    
    /**
     * Remove all permissions and set the given ones.
     *
     * @param array|string|int|Permission $permissions
     * @return array
     */
    public function syncPermissions($permissions): array
    {
        $permissions = $this->getStoredPermissions($permissions);
        
        $this->permissions()->sync($permissions);
        
        return $permissions->pluck('id')->toArray();
    }
    
    /**
     * Check if the role has the given permission.
     *
     * @param string|Permission $permission
     * @return bool
     */
    public function hasPermissionTo($permission): bool
    {
        try {
            if (is_string($permission)) {
                $permission = Permission::where('name', $permission)->first();
            }
            
            if (!$permission) {
                return false;
            }
            
            // Load permissions if not already loaded
            if (!$this->relationLoaded('permissions')) {
                $this->load('permissions');
            }
            
            return $this->permissions->contains('id', $permission->id);
        } catch (\Exception $e) {
            \Log::error('Error checking role permission: ' . $e->getMessage(), [
                'role_id' => $this->id,
                'permission' => $permission,
                'exception' => $e
            ]);
            return false;
        }
    }
    
    /**
     * Get the stored permissions.
     *
     * @param array|string|int|Permission $permissions
     * @return \Illuminate\Support\Collection
     */
    /**
     * Get the stored permissions from the given input.
     *
     * @param mixed $permissions
     * @return \Illuminate\Support\Collection
     */
    protected function getStoredPermissions($permissions)
    {
        if (is_string($permissions)) {
            return Permission::where('slug', $permissions)->get();
        }
        
        if (is_int($permissions)) {
            return Permission::where('id', $permissions)->get();
        }
        
        if ($permissions instanceof Permission) {
            return collect([$permissions]);
        }
        
        if (is_array($permissions)) {
            return Permission::whereIn('id', $permissions)
                ->orWhereIn('slug', $permissions)
                ->get();
        }
        
        return $permissions;
    }

    /**
     * Get the default role.
     */
    public static function getDefault(): ?self
    {
        return static::where('is_default', true)->first();
    }

    /**
     * Find a role by its slug.
     */
    public static function findBySlug(string $slug): ?self
    {
        return static::where('slug', $slug)->first();
    }

    /**
     * Check if the role has the given slug.
     */
    public function hasSlug(string $slug): bool
    {
        return $this->slug === $slug;
    }
}
