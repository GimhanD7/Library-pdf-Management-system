<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'phone_number',
        'department',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['is_admin'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Get the role that owns the user.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the publications for the user.
     */
    /**
     * Get the publications for the user.
     */
    public function publications(): HasMany
    {
        return $this->hasMany(Publication::class);
    }

    /**
     * Get the user's role name.
     *
     * @return string|null
     */
    public function getRoleNameAttribute(): ?string
    {
        return $this->role ? $this->role->name : null;
    }
    
    /**
     * Check if the user is an admin.
     *
     * @return bool
     */
    public function getIsAdminAttribute(): bool
    {
        if (!$this->relationLoaded('role')) {
            $this->load('role');
        }
        
        if (!$this->role) {
            return false;
        }
        
        // Check if the role name or slug is 'admin'
        return in_array(strtolower($this->role->name ?? ''), ['admin']) || 
               in_array(strtolower($this->role->slug ?? ''), ['admin']);
    }
    
    /**
     * Assign a role to the user.
     *
     * @param string|int|Role $role
     * @return self
     */
    public function assignRole($role): self
    {
        if (is_string($role) || is_int($role)) {
            $role = Role::where(is_numeric($role) ? 'id' : 'slug', $role)->firstOrFail();
        }
        
        $this->role()->associate($role);
        $this->save();
        
        return $this;
    }
    
    /**
     * Check if the user has a role.
     *
     * @param string|array $roles
     * @return bool
     */
    public function hasRole($roles): bool
    {
        if (!$this->relationLoaded('role')) {
            \Log::debug('User role relation not loaded, loading now', ['user_id' => $this->id]);
            $this->load('role');
        }
        
        if (!$this->role) {
            \Log::debug('User has no role assigned', ['user_id' => $this->id]);
            return false;
        }
        
        $roles = is_array($roles) ? $roles : [$roles];
        \Log::debug('Checking roles for user', [
            'user_id' => $this->id,
            'user_role' => [
                'id' => $this->role->id,
                'name' => $this->role->name,
                'slug' => $this->role->slug
            ],
            'requested_roles' => $roles
        ]);
        
        foreach ($roles as $role) {
            $originalRole = $role;
            // Check if role is an object with slug or name property
            if (is_object($role)) {
                $role = $role->slug ?? $role->name ?? null;
                if ($role === null) {
                    \Log::debug('Invalid role object provided', ['role_object' => $originalRole]);
                    continue;
                }
            }
            
            // Check role by slug or name
            $roleMatch = strtolower($this->role->slug) === strtolower($role) || 
                        strtolower($this->role->name) === strtolower($role);
                        
            if ($roleMatch) {
                \Log::debug('Role match found', [
                    'user_id' => $this->id,
                    'requested_role' => $role,
                    'user_role' => [
                        'name' => $this->role->name,
                        'slug' => $this->role->slug
                    ]
                ]);
                return true;
            } else {
                \Log::debug('Role does not match', [
                    'user_id' => $this->id,
                    'requested_role' => $role,
                    'user_role' => [
                        'name' => $this->role->name,
                        'slug' => $this->role->slug
                    ]
                ]);
            }
        }
        
        \Log::debug('No matching roles found for user', [
            'user_id' => $this->id,
            'user_role' => [
                'name' => $this->role->name,
                'slug' => $this->role->slug
            ],
            'requested_roles' => $roles
        ]);
        
        return false;
    }
    
    /**
     * Check if the user has any of the given roles.
     *
     * @param array $roles
     * @return bool
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->hasRole($roles);
    }
    
    /**
     * Check if the user has all of the given roles.
     *
     * @param array $roles
     * @return bool
     */
    public function hasAllRoles(array $roles): bool
    {
        foreach ($roles as $role) {
            if (!$this->hasRole($role)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Alias for hasPermissionTo for compatibility
     *
     * @param string|Permission $permission
     * @return bool
     */
    public function hasPermission($permission): bool
    {
        return $this->hasPermissionTo($permission);
    }

    /**
     * Check if the user has a permission.
     *
     * @param string|Permission $permission
     * @return bool
     */
    public function hasPermissionTo($permission): bool
    {
        if ($this->is_admin) {
            return true;
        }
        
        try {
            if (!$this->relationLoaded('role')) {
                $this->load('role');
            }
            
            if (!$this->role) {
                return false;
            }
            
            // Load permissions if not already loaded
            if (!$this->role->relationLoaded('permissions')) {
                $this->role->load('permissions');
            }
            
            return $this->role->hasPermissionTo($permission);
        } catch (\Exception $e) {
            \Log::error('Error checking permission: ' . $e->getMessage(), [
                'user_id' => $this->id,
                'permission' => $permission,
                'exception' => $e
            ]);
            return false;
        }
    }
    
    /**
     * Check if the user has any of the given permissions.
     *
     * @param array $permissions
     * @return bool
     */
    public function hasAnyPermission(array $permissions): bool
    {
        if ($this->is_admin) {
            return true;
        }
        
        foreach ($permissions as $permission) {
            if ($this->hasPermissionTo($permission)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if the user has all of the given permissions.
     *
     * @param array $permissions
     * @return bool
     */
    public function hasAllPermissions(array $permissions): bool
    {
        if ($this->is_admin) {
            return true;
        }
        
        foreach ($permissions as $permission) {
            if (!$this->hasPermissionTo($permission)) {
                return false;
            }
        }
        
        return true;
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

        if (!$this->role->relationLoaded('permissions')) {
            $this->role->load('permissions');
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
     * Check if user is an admin
     *
     * @return bool
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if user is a regular user
     *
     * @return bool
     */
    public function isUser(): bool
    {
        return $this->hasRole('user');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

}
