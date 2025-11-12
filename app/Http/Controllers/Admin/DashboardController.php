<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Publication;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Display the admin dashboard.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Get basic stats
        $stats = [
            'total_users' => User::count(),
            'total_publications' => Publication::count(),
            'total_roles' => \App\Models\Role::count(),
            'system_status' => 'active',
        ];

        // Get recent activities
        $recentActivities = [];
        
        // Get recent user registrations
        $recentUsers = User::latest()->take(3)->get();
        foreach ($recentUsers as $user) {
            $recentActivities[] = [
                'id' => 'user_' . $user->id,
                'type' => 'user',
                'title' => 'New User Registration',
                'description' => $user->name . ' joined the platform',
                'timestamp' => $user->created_at->toISOString(),
                'icon' => 'Users',
            ];
        }

        // Get recent publications if any
        $recentPublications = Publication::latest()->take(3)->get();
        foreach ($recentPublications as $publication) {
            $recentActivities[] = [
                'id' => 'pub_' . $publication->id,
                'type' => 'publication',
                'title' => 'New Publication Added',
                'description' => $publication->title . ' was added to the library',
                'timestamp' => $publication->created_at->toISOString(),
                'icon' => 'BookOpen',
            ];
        }

        // Sort activities by timestamp
        usort($recentActivities, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        // Take only the 5 most recent activities
        $recentActivities = array_slice($recentActivities, 0, 5);
        
        return inertia('Admin/Dashboard', [
            'stats' => $stats,
            'recentActivities' => $recentActivities,
        ]);
    }
    
    // Add any additional dashboard-related methods here
}
