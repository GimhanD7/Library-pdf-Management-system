<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Publication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ActivitiesController extends Controller
{
    /**
     * Display a listing of activities.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    /**
     * Get activities with optional filters
     */
    protected function getActivities($filters = [])
    {
        $activities = [];
        
        // Base query for users
        $userQuery = User::query();
        
        // Apply filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $userQuery->where('name', 'like', "%{$search}%")
                     ->orWhere('email', 'like', "%{$search}%");
        }
        
        if (!empty($filters['date_from'])) {
            $userQuery->where('created_at', '>=', $filters['date_from']);
        }
        
        if (!empty($filters['date_to'])) {
            $userQuery->where('created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        
        // Get user activities
        $recentUsers = $userQuery->latest()->take(100)->get();
        
        foreach ($recentUsers as $user) {
            $activities[] = [
                'id' => 'user_' . $user->id,
                'type' => 'user',
                'title' => 'New User Registration',
                'description' => $user->name . ' joined the platform',
                'timestamp' => $user->created_at->toISOString(),
                'icon' => 'Users',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar_url ?? null,
                ],
                'details' => [
                    'Email' => $user->email,
                    'Role' => $user->role?->name ?? 'User',
                    'Registered At' => $user->created_at->format('M d, Y H:i:s'),
                ]
            ];
        }

        // Base query for publications
        $publicationQuery = Publication::query();
        
        // Apply filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $publicationQuery->where('title', 'like', "%{$search}%")
                           ->orWhere('isbn', 'like', "%{$search}%");
        }
        
        if (!empty($filters['date_from'])) {
            $publicationQuery->where('created_at', '>=', $filters['date_from']);
        }
        
        if (!empty($filters['date_to'])) {
            $publicationQuery->where('created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }
        
        // Get publication activities
        $recentPublications = $publicationQuery->latest()->take(100)->get();
        
        foreach ($recentPublications as $publication) {
            $activities[] = [
                'id' => 'pub_' . $publication->id,
                'type' => 'publication',
                'title' => 'New Publication Added',
                'description' => $publication->title . ' was added to the library',
                'timestamp' => $publication->created_at->toISOString(),
                'icon' => 'BookOpen',
                'user' => [
                    'id' => $publication->creator_id,
                    'name' => $publication->creator?->name ?? 'System',
                    'email' => $publication->creator?->email ?? '',
                    'avatar' => $publication->creator?->avatar_url ?? null,
                ],
                'details' => [
                    'Title' => $publication->title,
                    'ISBN' => $publication->isbn ?? 'N/A',
                    'Author' => $publication->author,
                    'Published Year' => $publication->published_year,
                    'Added At' => $publication->created_at->format('M d, Y H:i:s'),
                ]
            ];
        }

        // Sort activities by timestamp (newest first)
        usort($activities, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        // Apply type filter if specified
        if (!empty($filters['type'])) {
            $activities = array_filter($activities, function($activity) use ($filters) {
                return $activity['type'] === $filters['type'];
            });
        }

        return array_values($activities);
    }

    /**
     * Display a listing of activities.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'type', 'date_from', 'date_to']);
        $activities = $this->getActivities($filters);

        // Paginate manually
        $perPage = 20;
        $currentPage = $request->input('page', 1);
        $currentItems = array_slice($activities, ($currentPage - 1) * $perPage, $perPage);

        // Get unique activity types for filter
        $activityTypes = [
            ['value' => 'user', 'label' => 'User Activities'],
            ['value' => 'publication', 'label' => 'Publication Activities'],
        ];

        return Inertia::render('Admin/Activities/Index', [
            'activities' => $currentItems,
            'filters' => $filters,
            'activityTypes' => $activityTypes,
            'pagination' => [
                'current_page' => (int)$currentPage,
                'total' => count($activities),
                'per_page' => $perPage,
                'last_page' => ceil(count($activities) / $perPage),
            ],
        ]);
    }

    /**
     * Export activities as CSV
     */
    public function exportCsv(Request $request)
    {
        $filters = $request->only(['search', 'type', 'date_from', 'date_to']);
        $activities = $this->getActivities($filters);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="activities_' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($activities) {
            $file = fopen('php://output', 'w');
            
            // Add CSV headers
            fputcsv($file, ['Type', 'Title', 'Description', 'Date', 'Details']);
            
            // Add data rows
            foreach ($activities as $activity) {
                $details = [];
                foreach ($activity['details'] as $key => $value) {
                    $details[] = "$key: $value";
                }
                
                fputcsv($file, [
                    ucfirst($activity['type']),
                    $activity['title'],
                    $activity['description'],
                    Carbon::parse($activity['timestamp'])->format('Y-m-d H:i:s'),
                    implode("\n", $details)
                ]);
            }
            
            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }

    /**
     * Export activities as PDF
     */
    public function exportPdf(Request $request)
    {
        $filters = $request->only(['search', 'type', 'date_from', 'date_to']);
        $activities = $this->getActivities($filters);
        
        $pdf = PDF::loadView('exports.activities-pdf', [
            'activities' => $activities,
            'filters' => $filters,
            'date' => now()->format('F j, Y'),
        ]);
        
        return $pdf->download('activities_' . now()->format('Y-m-d') . '.pdf');
    }
}