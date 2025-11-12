<?php

namespace App\Providers;

use Illuminate\Support\Facades\Session;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // No RabbitMQ service registration
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Share the sidebar state with all views
        Inertia::share('sidebarOpen', function () {
            return Session::get('sidebarOpen', true);
        });

        // Share CSRF token with Inertia
        Inertia::share('csrfToken', function () {
            return csrf_token();
        });
    }
}
