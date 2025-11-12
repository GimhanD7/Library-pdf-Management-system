<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        Log::info('Admin Middleware - Starting', ['path' => $request->path()]);
        
        if (!auth()->check()) {
            Log::warning('Admin Middleware - User not authenticated');
            return redirect()->route('login');
        }

        $user = auth()->user();
        
        // Debug logging
        Log::info('Admin Middleware - User Check', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role_relation_loaded' => $user->relationLoaded('role'),
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'slug' => $user->role->slug
            ] : null,
            'is_admin' => $user->is_admin,
            'is_admin_calc' => $this->checkIfAdmin($user)
        ]);

        // Check if user is admin using the accessor
        if (!$user->is_admin) {
            Log::warning('Admin Middleware - Access Denied', [
                'user_id' => $user->id,
                'is_admin' => $user->is_admin
            ]);
            return redirect()->route('dashboard')
                ->with('error', 'You do not have permission to access the admin area.');
        }
        
        Log::info('Admin Middleware - Access Granted', ['user_id' => $user->id]);

        return $next($request);
    }
    
    /**
     * Check if the user is an admin
     */
    protected function checkIfAdmin($user): bool
    {
        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }
        
        if (!$user->role) {
            return false;
        }
        
        return in_array(strtolower($user->role->name ?? ''), ['admin']) || 
               in_array(strtolower($user->role->slug ?? ''), ['admin']);
    }
}
