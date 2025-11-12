<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LibrarianMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        \Log::info('LibrarianMiddleware: Checking access', [
            'path' => $request->path(),
            'user' => Auth::check() ? Auth::user()->id : 'guest'
        ]);

        if (!Auth::check()) {
            \Log::warning('LibrarianMiddleware: User not authenticated');
            
            // Check if the request is an API request
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated.',
                ], 401);
            }
            
            return redirect()->route('login');
        }

        $user = Auth::user();
        
        try {
            $hasAdminRole = $user->hasRole('admin');
            $hasLibrarianRole = $user->hasRole('librarian');

            \Log::info('LibrarianMiddleware: User roles', [
                'user_id' => $user->id,
                'email' => $user->email,
                'has_admin_role' => $hasAdminRole,
                'has_librarian_role' => $hasLibrarianRole,
                'role' => $user->role ? $user->role->name : null
            ]);

            if ($hasAdminRole || $hasLibrarianRole) {
                return $next($request);
            }
            
            // If we get here, user doesn't have required roles
            \Log::warning('LibrarianMiddleware: Access denied', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role ? $user->role->name : null
            ]);
            
            // Return JSON response for API requests
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. You do not have permission to access this resource.',
                ], 403);
            }
            abort(403, 'You do not have permission to access this resource.');
        } catch (\Exception $e) {
            \Log::error('LibrarianMiddleware: Error checking user roles', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return JSON response for API requests
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Internal server error while checking permissions.',
                ], 500);
            }
            abort(500, 'Internal server error while checking permissions.');
        }

        return $next($request);
    }
}
