<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        // Temporarily disable authorization until permission system is fully set up
        // $this->authorize('viewAny', User::class);
        
        try {
            \Log::info('UserController@index called');
            
            $users = User::with('role')
                ->select(['id', 'name', 'email', 'role_id', 'phone_number', 'department', 'created_at'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role ? [
                            'id' => $user->role->id,
                            'name' => $user->role->name,
                            'slug' => $user->role->slug
                        ] : null,
                        'role_id' => $user->role_id,
                        'phone_number' => $user->phone_number,
                        'department' => $user->department,
                        'created_at' => $user->created_at
                    ];
                });
                
            $roles = \App\Models\Role::select(['id', 'name', 'slug'])->get();

            \Log::info('UserController@index data', [
                'users_count' => $users->count(),
                'roles_count' => $roles->count(),
                'users' => $users->toArray(),
                'roles' => $roles->toArray()
            ]);

            return Inertia::render('Admin/Users/Index', [
                'users' => $users->toArray(),
                'roles' => $roles->toArray()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in UserController@index: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return empty data to prevent crashes
            return Inertia::render('Admin/Users/Index', [
                'users' => [],
                'roles' => []
            ]);
        }
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        // $this->authorize('create', User::class);
        
        $roles = \App\Models\Role::select(['id', 'name', 'slug'])->get();

        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles->toArray()
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        // $this->authorize('create', User::class);
        
        try {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
                'password' => ['required', 'string', 'min:8', 'confirmed'],
                'role' => ['required', 'string', 'exists:roles,slug'],
                'phone_number' => ['nullable', 'string', 'max:20'],
                'department' => ['nullable', 'string', 'max:255'],
            ]);

            // Get the role by slug
            $role = \App\Models\Role::where('slug', $validated['role'])->firstOrFail();
            
            // Create user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role_id' => $role->id,
                'phone_number' => !empty($validated['phone_number']) ? $validated['phone_number'] : null,
                'department' => !empty($validated['department']) ? $validated['department'] : null,
            ]);
            
            return redirect()->route('admin.users.index')
                ->with('success', 'User created successfully');
        } catch (\Exception $e) {
            \Log::error('Error creating user: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            
            return back()->withErrors(['error' => 'Failed to create user'])
                ->withInput();
        }
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        // $this->authorize('update', $user);
        
        $user->load('role');
        $roles = \App\Models\Role::select(['id', 'name', 'slug'])->get();

        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                    'slug' => $user->role->slug
                ] : null,
                'role_id' => $user->role_id,
                'phone_number' => $user->phone_number,
                'department' => $user->department,
            ],
            'roles' => $roles->toArray()
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        // $this->authorize('update', $user);
        
        try {
            // Log the incoming request data
            \Log::info('Updating user', [
                'user_id' => $user->id,
                'request_data' => $request->all()
            ]);
            
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
                'role' => ['required', 'string', 'exists:roles,slug'],
                'phone_number' => ['nullable', 'string', 'max:20'],
                'department' => ['nullable', 'string', 'max:255'],
            ]);

            // Get the role by slug
            $role = \App\Models\Role::where('slug', $validated['role'])->firstOrFail();
            
            // Update user data
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role_id' => $role->id,
                'phone_number' => !empty($validated['phone_number']) ? $validated['phone_number'] : null,
                'department' => !empty($validated['department']) ? $validated['department'] : null,
            ]);
            
            // Load the role relationship
            $user->load('role');
            
            // Return an Inertia response
            return redirect()->route('admin.users.index')
                ->with('success', 'User updated successfully');
        } catch (\Exception $e) {
            \Log::error('Error updating user: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'message' => 'Error updating user: ' . $e->getMessage(),
                'errors' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(User $user)
    {
        // $this->authorize('delete', $user);
        
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
