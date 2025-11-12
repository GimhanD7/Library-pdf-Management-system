<?php

namespace App\Http\Controllers;

use App\Models\Publication;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatistics()
    {
        \Log::info('Dashboard statistics requested');
        
        try {
            // Check database connection
            if (!DB::connection()->getPdo()) {
                throw new \Exception('Database connection failed');
            }
            
            $user = auth()->user();
            if (!$user) {
                \Log::error('No authenticated user');
                return response()->json(['error' => 'Not authenticated'], 401);
            }
            
            \Log::info('Fetching statistics for user: ' . $user->id);
            
            // Initialize default values
            $totalPublications = 0;
            $publicationsThisMonth = 0;
            $totalUsers = 0;
            $publicationsByYear = collect();
            $recentActivity = collect();
            
            try {
                // Total publications count - ALL publications in database
                $totalPublications = Publication::count();
                \Log::info('Total publications (all users): ' . $totalPublications);
                
                // Publications added this month - ALL publications this month
                $publicationsThisMonth = Publication::whereYear('created_at', now()->year)
                    ->whereMonth('created_at', now()->month)
                    ->count();
                
                // Total users count - ALL users in database
                $totalUsers = User::count();
                \Log::info('Total users: ' . $totalUsers);
                
                // Get count by year for the chart - ALL publications by year
                // Get monthly publication count for current year
                $monthlyPublications = Publication::select(
                        DB::raw('MONTH(created_at) as month'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->whereYear('created_at', now()->year)
                    ->groupBy(DB::raw('MONTH(created_at)'))
                    ->orderBy('month')
                    ->get()
                    ->pluck('count', 'month')
                    ->toArray();

                // Get monthly user registrations for current year
                $monthlyUsers = User::select(
                        DB::raw('MONTH(created_at) as month'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->whereYear('created_at', now()->year)
                    ->groupBy(DB::raw('MONTH(created_at)'))
                    ->orderBy('month')
                    ->get()
                    ->pluck('count', 'month')
                    ->toArray();

                // Initialize arrays with all months set to 0
                $monthlyData = [
                    'months' => [],
                    'publications' => [],
                    'users' => []
                ];
                
                for ($i = 1; $i <= 12; $i++) {
                    $monthName = date('M', mktime(0, 0, 0, $i, 1));
                    $monthlyData['months'][] = $monthName;
                    $monthlyData['publications'][] = (int)($monthlyPublications[$i] ?? 0);
                    $monthlyData['users'][] = (int)($monthlyUsers[$i] ?? 0);
                }
                
                // Log the data being sent to the frontend
                \Log::info('Monthly Data:', $monthlyData);

                // Get yearly publication counts
                $publicationsByYear = Publication::select(
                        DB::raw('YEAR(created_at) as year'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->groupBy(DB::raw('YEAR(created_at)'))
                    ->orderBy('year', 'desc')
                    ->get();
                
                // Get recent activity (last 5 publications from all users)
                $recentActivity = Publication::with('user')
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get()
                    ->map(function($publication) {
                        return [
                            'id' => $publication->id,
                            'title' => $publication->title,
                            'time' => $publication->created_at->diffForHumans(),
                            'type' => 'publication',
                            'icon' => 'file-text',
                            'user' => $publication->user ? $publication->user->name : 'Unknown User'
                        ];
                    });
                    
            } catch (\Exception $queryError) {
                \Log::error('Database query error: ' . $queryError->getMessage());
                \Log::error($queryError->getTraceAsString());
                
                // Return partial data if possible
                return response()->json([
                    'stats' => [
                        'total_publications' => $totalPublications,
                        'publications_this_month' => $publicationsThisMonth,
                        'total_users' => $totalUsers,
                        'publications_by_year' => $publicationsByYear,
                    ],
                    'recent_activity' => $recentActivity,
                    'warning' => 'Some data may be incomplete due to an error',
                    'error' => $queryError->getMessage()
                ], 206); // 206 Partial Content
            }
            
            $response = [
                'stats' => [
                    'total_publications' => $totalPublications,
                    'publications_this_month' => $publicationsThisMonth,
                    'total_users' => $totalUsers,
                    'monthly_data' => $monthlyData,
                    'publications_by_year' => $publicationsByYear,
                ],
                'recent_activity' => $recentActivity
            ];
            
            \Log::info('Dashboard statistics response', $response);
            return response()->json($response);
            
        } catch (\Exception $e) {
            $errorMessage = 'Error in getStatistics: ' . $e->getMessage();
            \Log::error($errorMessage);
            \Log::error($e->getTraceAsString());
            
            // Return a more detailed error response
            return response()->json([
                'error' => 'Failed to load dashboard data',
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile() . ':' . $e->getLine(),
                'trace' => config('app.debug') ? $e->getTrace() : []
            ], 500);
        }
    }
}
