<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Publication;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function generate(Request $request)
    {
        try {
            // Get current date for filename
            $date = Carbon::now()->format('Y-m-d');
            $filename = "library-report-{$date}.pdf";
            
            // Get real statistics from database
            $stats = $this->getStatistics();
            
            // Get monthly data for charts
            $monthlyData = $this->getMonthlyData();
            
            // Get recent publications
            $recentPublications = $this->getRecentPublications();
            
            // Get user statistics
            $userStats = $this->getUserStatistics();
            
            // Generate PDF using DomPDF
            $pdf = Pdf::loadView('reports.pdf', [
                'title' => 'Library Management System Report',
                'date' => now()->format('F j, Y'),
                'generated_at' => now()->format('F j, Y \a\t g:i A'),
                'stats' => $stats,
                'monthly_data' => $monthlyData,
                'recent_publications' => $recentPublications,
                'user_stats' => $userStats,
            ]);
            
            // Set PDF options
            $pdf->setPaper('A4', 'portrait');
            $pdf->setOptions([
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => false,
                'defaultFont' => 'Arial',
                'dpi' => 150,
                'defaultPaperSize' => 'A4',
            ]);
            
            // Return PDF as download
            return $pdf->download($filename);
            
        } catch (\Exception $e) {
            \Log::error('Report generation failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to generate report',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    private function getStatistics()
    {
        $totalPublications = Publication::count();
        $publicationsThisMonth = Publication::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $totalUsers = User::count();
        $usersThisMonth = User::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
            
        return [
            'total_publications' => $totalPublications,
            'publications_this_month' => $publicationsThisMonth,
            'total_users' => $totalUsers,
            'users_this_month' => $usersThisMonth,
            'avg_publications_per_month' => round($totalPublications / max(1, now()->diffInMonths(Publication::min('created_at') ?? now())), 1),
        ];
    }
    
    private function getMonthlyData()
    {
        $months = [];
        $publications = [];
        $users = [];
        
        // Get last 6 months of data
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $months[] = $date->format('M Y');
            
            $publications[] = Publication::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->count();
                
            $users[] = User::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->count();
        }
        
        return [
            'months' => $months,
            'publications' => $publications,
            'users' => $users,
        ];
    }
    
    private function getRecentPublications()
    {
        return Publication::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($publication) {
                return [
                    'title' => $publication->title ?? $publication->original_filename,
                    'date' => $publication->created_at->format('M j, Y'),
                    'user' => $publication->user->name ?? 'Unknown',
                    'type' => $publication->type ?? 'Publication',
                ];
            });
    }
    
    private function getUserStatistics()
    {
        $roleStats = DB::table('users')
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->select('roles.name as role_name', DB::raw('count(*) as count'))
            ->groupBy('roles.name')
            ->get();
            
        return [
            'by_role' => $roleStats,
            'total_active' => User::whereNotNull('email_verified_at')->count(),
            'total_inactive' => User::whereNull('email_verified_at')->count(),
        ];
    }
}
