<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default File Upload Settings
    |--------------------------------------------------------------------------
    |
    | This option controls the default file upload settings for the application.
    | These settings can be overridden at runtime.
    |
    */

    'defaults' => [
        'disk' => env('FILESYSTEM_DISK', 's3'),
        'directory' => 'publications',
        'visibility' => 'public',
        'max_file_size' => 10240, // 10MB in KB
        'allowed_mime_types' => [
            'application/pdf',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | File Naming Strategy
    |--------------------------------------------------------------------------
    |
    | This option controls how uploaded files are named. The default strategy
    | uses a combination of the original filename, a timestamp, and a random
    | string to ensure unique filenames.
    |
    */

    'naming' => [
        'strategy' => 'original', // Options: original, hash, timestamp, uuid
        'separator' => '_',
    ],

    /*
    |--------------------------------------------------------------------------
    | Image Processing
    |--------------------------------------------------------------------------
    |
    | These options control the image processing settings for uploaded images.
    |
    */

    'image' => [
        'generate_thumbnails' => true,
        'thumbnail_sizes' => [
            'small' => [
                'width' => 200,
                'height' => 200,
                'method' => 'fit', // fit, resize, crop, etc.
            ],
            'medium' => [
                'width' => 500,
                'height' => 500,
                'method' => 'fit',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | File Validation Rules
    |--------------------------------------------------------------------------
    |
    | These rules will be used to validate uploaded files. You can customize
    | these rules based on your application's requirements.
    |
    */

    'validation' => [
        'rules' => [
            'file' => 'required|file|max:10240', // 10MB
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'month' => 'required|integer|min:1|max:12',
            'day' => 'required|integer|min:1|max:31',
            'page' => 'nullable|integer|min:1',
        ],
        'messages' => [
            'file.required' => 'Please select a file to upload',
            'file.mimes' => 'The file must be a PDF',
            'file.max' => 'The file may not be greater than 10MB',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue Configuration
    |--------------------------------------------------------------------------
    |
    | These options configure how file uploads are processed in the background.
    |
    */

    'queue' => [
        'enable' => true,
        'connection' => env('QUEUE_CONNECTION', 'database'),
        'queue' => 'file-uploads',
        'tries' => 3,
        'backoff' => [10, 30, 60], // seconds between retries
    ],

    /*
    |--------------------------------------------------------------------------
    | Cleanup Configuration
    |--------------------------------------------------------------------------
    |
    | These options control how temporary files are cleaned up.
    |
    */

    'cleanup' => [
        'temporary_files' => [
            'enabled' => true,
            'older_than_minutes' => 1440, // 24 hours
        ],
    ],
];
