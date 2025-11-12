<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'sidebarOpen' => $request->session()->get('sidebarOpen', true),
            'auth' => [
                'user' => $request->user() ? $this->getUserWithRole($request->user()) : null,
                'can' => $request->user() ? $this->getUserPermissions($request->user()) : [],
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Get user with role formatted for frontend
     */
    private function getUserWithRole($user)
    {
        try {
            // Load the single role relationship
            $user->load('role');
            
            // Convert the single role to a roles array for frontend consistency
            $userArray = $user->toArray();
            $userArray['roles'] = $user->role ? [['name' => $user->role->name]] : [];
            
            return $userArray;
        } catch (\Exception $e) {
            \Log::error('Error loading user role: ' . $e->getMessage());
            return $user;
        }
    }

    /**
     * Get user permissions dynamically from database
     */
    private function getUserPermissions($user): array
    {
        try {
            // Check if permissions table exists
            if (!\DB::getSchemaBuilder()->hasTable('permissions')) {
                \Log::warning('Permissions table does not exist');
                return [];
            }

            // Get all permissions from database
            $allPermissions = \App\Models\Permission::all();
            
            // Build permissions array dynamically based on database only
            $permissions = [];
            
            foreach ($allPermissions as $permission) {
                $permissionName = $permission->name;
                $permissionKey = str_replace(' ', '_', $permissionName); // Convert "delete publications" to "delete_publications"
                
                // Check if user has the permission - strictly from database
                $hasPermission = $user->hasPermissionTo($permissionName);
                
                // Store permission status
                $permissions[$permissionKey] = $hasPermission;
            }
            
            return $permissions;
            
        } catch (\Exception $e) {
            \Log::error('Error getting user permissions: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return empty array on error - no permissions granted
            return [];
        }
    }
}
