<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class RabbitMQServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // No RabbitMQ service registration
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
