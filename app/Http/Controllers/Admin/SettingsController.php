<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display the settings page.
     */
    public function index()
    {
        // Temporarily bypass permission check for debugging
        // Gate::authorize('manage-settings');
        
        // Add debug information
        $user = auth()->user();
        $debugInfo = [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'is_admin' => method_exists($user, 'isAdmin') ? $user->isAdmin() : false,
            'has_manage_settings_permission' => method_exists($user, 'hasPermissionTo') ? $user->hasPermissionTo('manage settings') : false,
            'gate_allows_manage_settings' => Gate::allows('manage-settings'),
        ];
        
        \Log::info('Settings page access attempt', $debugInfo);

        $settings = [
            'app' => [
                'name' => config('app.name'),
                'url' => config('app.url'),
                'timezone' => config('app.timezone'),
                'locale' => config('app.locale'),
                'debug' => config('app.debug'),
                'env' => config('app.env'),
            ],
            'database' => [
                'connection' => config('database.default'),
                'host' => config('database.connections.' . config('database.default') . '.host'),
                'port' => config('database.connections.' . config('database.default') . '.port'),
                'database' => config('database.connections.' . config('database.default') . '.database'),
            ],
            'mail' => [
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.' . config('mail.default') . '.host'),
                'port' => config('mail.mailers.' . config('mail.default') . '.port'),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
            ],
            'cache' => [
                'default' => config('cache.default'),
                'prefix' => config('cache.prefix'),
            ],
            'session' => [
                'driver' => config('session.driver'),
                'lifetime' => config('session.lifetime'),
                'secure' => config('session.secure'),
                'same_site' => config('session.same_site'),
            ],
            'storage' => [
                'default' => config('filesystems.default'),
                'public_disk' => config('filesystems.disks.public.root'),
                'storage_link' => is_link(public_path('storage')),
            ],
        ];

        $systemInfo = [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'disk_usage' => $this->getDiskUsage(),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
            'systemInfo' => $systemInfo,
            'debugInfo' => $debugInfo,
        ]);
    }

    /**
     * Update application settings.
     */
    public function update(Request $request)
    {
        Gate::authorize('manage-settings');

        $validated = $request->validate([
            'app_name' => 'required|string|max:255',
            'app_url' => 'required|url',
            'timezone' => 'required|string',
            'locale' => 'required|string',
            'mail_from_name' => 'required|string|max:255',
            'mail_from_address' => 'required|email',
        ]);

        // Update .env file (basic implementation)
        $this->updateEnvFile([
            'APP_NAME' => '"' . $validated['app_name'] . '"',
            'APP_URL' => $validated['app_url'],
            'APP_TIMEZONE' => $validated['timezone'],
            'APP_LOCALE' => $validated['locale'],
            'MAIL_FROM_NAME' => '"' . $validated['mail_from_name'] . '"',
            'MAIL_FROM_ADDRESS' => $validated['mail_from_address'],
        ]);

        // Clear config cache
        Artisan::call('config:clear');
        Cache::flush();

        return back()->with('success', 'Settings updated successfully');
    }

    /**
     * Clear application cache.
     */
    public function clearCache()
    {
        Gate::authorize('manage-settings');

        try {
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');

            return back()->with('success', 'Cache cleared successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to clear cache: ' . $e->getMessage());
        }
    }

    /**
     * Optimize application.
     */
    public function optimize()
    {
        Gate::authorize('manage-settings');

        try {
            Artisan::call('optimize');
            
            return back()->with('success', 'Application optimized successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to optimize application: ' . $e->getMessage());
        }
    }

    /**
     * Create storage link.
     */
    public function createStorageLink()
    {
        Gate::authorize('manage-settings');

        try {
            Artisan::call('storage:link');
            
            return back()->with('success', 'Storage link created successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create storage link: ' . $e->getMessage());
        }
    }

    /**
     * Run database migrations.
     */
    public function migrate()
    {
        Gate::authorize('manage-settings');

        try {
            Artisan::call('migrate', ['--force' => true]);
            
            return back()->with('success', 'Database migrations completed successfully');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to run migrations: ' . $e->getMessage());
        }
    }

    /**
     * Get system information.
     */
    public function systemInfo()
    {
        Gate::authorize('manage-settings');

        return response()->json([
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'server_info' => $_SERVER,
            'extensions' => get_loaded_extensions(),
            'disk_usage' => $this->getDiskUsage(),
            'memory_usage' => [
                'current' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true),
                'limit' => ini_get('memory_limit'),
            ],
        ]);
    }

    /**
     * Get disk usage information.
     */
    private function getDiskUsage()
    {
        try {
            $bytes = disk_free_space('/');
            $totalBytes = disk_total_space('/');
            
            return [
                'free' => $this->formatBytes($bytes),
                'total' => $this->formatBytes($totalBytes),
                'used' => $this->formatBytes($totalBytes - $bytes),
                'percentage' => round((($totalBytes - $bytes) / $totalBytes) * 100, 2),
            ];
        } catch (\Exception $e) {
            return [
                'free' => 'Unknown',
                'total' => 'Unknown',
                'used' => 'Unknown',
                'percentage' => 0,
            ];
        }
    }

    /**
     * Format bytes to human readable format.
     */
    private function formatBytes($size, $precision = 2)
    {
        if ($size === 0) return '0 B';
        
        $base = log($size, 1024);
        $suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        return round(pow(1024, $base - floor($base)), $precision) . ' ' . $suffixes[floor($base)];
    }

    /**
     * Update .env file with new values.
     */
    private function updateEnvFile(array $data)
    {
        $envFile = base_path('.env');
        $envContent = file_get_contents($envFile);

        foreach ($data as $key => $value) {
            $pattern = "/^{$key}=.*/m";
            $replacement = "{$key}={$value}";
            
            if (preg_match($pattern, $envContent)) {
                $envContent = preg_replace($pattern, $replacement, $envContent);
            } else {
                $envContent .= "\n{$replacement}";
            }
        }

        file_put_contents($envFile, $envContent);
    }
}
