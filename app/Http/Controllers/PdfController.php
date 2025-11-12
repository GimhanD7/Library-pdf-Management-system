<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PdfController extends Controller
{
    /**
     * Maximum number of files to return in directory listings
     */
    protected const MAX_DIRECTORY_LISTING = 50;

    /**
     * Allowed file extensions for PDFs
     */
    protected const ALLOWED_EXTENSIONS = ['pdf'];

    /**
     * Maximum file size for PDFs (50MB)
     */
    protected const MAX_FILE_SIZE = 50 * 1024 * 1024;

    /**
     * @var array Default headers for PDF responses
     */
    protected array $pdfResponseHeaders = [
        'Cache-Control' => 'public, max-age=31536000', // 1 year
        'Access-Control-Allow-Origin' => '*',
        'X-Content-Type-Options' => 'nosniff',
    ];

    /**
     * Generate a secure token for PDF viewing
     */
    public function generateToken(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'year' => 'required|string',
            'month' => 'required|string',
            'day' => 'required|string',
            'filename' => 'required|string',
        ]);

        // Create a secure token with expiration
        $data = [
            'name' => $validated['name'],
            'year' => $validated['year'],
            'month' => $validated['month'],
            'day' => $validated['day'],
            'filename' => $validated['filename'],
            'expires' => now()->addMinutes(30)->timestamp,
        ];

        $token = encrypt($data);

        return response()->json([
            'token' => $token,
            'url' => route('pdf.view.secure', ['token' => $token])
        ]);
    }

    /**
     * Serve PDF using secure token (URL hidden from network tab)
     */
    public function serveSecure($token)
    {
        try {
            // Decrypt the token
            $data = decrypt($token);

            // Check if token is expired
            if ($data['expires'] < now()->timestamp) {
                abort(403, 'Token expired');
            }

            // Build the file path
            $lowerName = strtolower($data['name']);
            $basePath = "publications/{$lowerName}/{$data['year']}/{$data['month']}/{$data['day']}";
            $requestedPath = "{$basePath}/{$data['filename']}";

            // Check if file exists
            if (!Storage::disk('public')->exists($requestedPath)) {
                abort(404, 'File not found');
            }

            // Get file content
            $file = Storage::disk('public')->get($requestedPath);
            $mimeType = Storage::disk('public')->mimeType($requestedPath) ?? 'application/pdf';

            // Use the original filename for display
            $displayFilename = $data['filename'];

            // Return with headers that prevent caching, downloading, and hide URL
            return response($file, 200)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline; filename="' . $displayFilename . '"')
                ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
                ->header('Pragma', 'no-cache')
                ->header('X-Content-Type-Options', 'nosniff')
                ->header('X-Frame-Options', 'SAMEORIGIN')
                ->header('Content-Security-Policy', "default-src 'none'; script-src 'none'; object-src 'none';")
                ->header('X-Download-Options', 'noopen')
                ->header('X-Permitted-Cross-Domain-Policies', 'none');

        } catch (\Exception $e) {
            \Log::error('Error serving secure PDF: ' . $e->getMessage());
            abort(403, 'Invalid or expired token');
        }
    }

    /**
     * Serve a PDF file from storage
     *
     * @param string $name
     * @param string $year
     * @param string $month
     * @param string $day
     * @param string $filename
     * @return \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\Response
     */
    public function servePdf($name, $year, $month, $day, $filename)
    {
        try {
            // Log the incoming request
            \Log::info('PDF Access Request:', [
                'name' => $name,
                'year' => $year,
                'month' => $month,
                'day' => $day,
                'filename' => $filename,
                'url' => request()->fullUrl()
            ]);

            // Convert name to lowercase to match directory structure
            $lowerName = strtolower($name);
            $basePath = "publications/{$lowerName}/{$year}/{$month}/{$day}";
            $requestedPath = "{$basePath}/{$filename}";
            $storagePath = storage_path('app/public/' . $basePath);
            $publicPath = public_path('storage/' . $basePath . '/' . $filename);

            // First try the exact path
            if (Storage::disk('public')->exists($requestedPath)) {
                $file = Storage::disk('public')->get($requestedPath);
                $mimeType = Storage::disk('public')->mimeType($requestedPath) ?? 'application/pdf';
                
                return response($file, 200)
                    ->header('Content-Type', $mimeType)
                    ->header('Content-Disposition', 'inline; filename="' . basename($requestedPath) . '"')
                    ->header('Cache-Control', 'public, max-age=31536000')
                    ->header('Access-Control-Allow-Origin', '*');
            }

            // If file not found, try case-insensitive search in the directory
            if (is_dir($storagePath)) {
                $files = scandir($storagePath);
                $filenameLower = strtolower($filename);
                
                foreach ($files as $file) {
                    if ($file !== '.' && $file !== '..' && strtolower($file) === $filenameLower) {
                        $foundPath = "{$basePath}/{$file}";
                        $file = Storage::disk('public')->get($foundPath);
                        $mimeType = Storage::disk('public')->mimeType($foundPath) ?? 'application/pdf';
                        
                        return response($file, 200)
                            ->header('Content-Type', $mimeType)
                            ->header('Content-Disposition', 'inline; filename="' . $file . '"')
                            ->header('Cache-Control', 'public, max-age=31536000')
                            ->header('Access-Control-Allow-Origin', '*');
                    }
                }
            }

            // If still not found, try a more flexible search
            $allFiles = Storage::disk('public')->allFiles('publications');
            $filenameBase = pathinfo($filename, PATHINFO_FILENAME);
            $filenameBaseLower = strtolower($filenameBase);
            
            foreach ($allFiles as $file) {
                $fileBase = pathinfo($file, PATHINFO_FILENAME);
                if (strtolower($fileBase) === $filenameBaseLower) {
                    $fileContent = Storage::disk('public')->get($file);
                    $mimeType = Storage::disk('public')->mimeType($file) ?? 'application/pdf';
                    
                    return response($fileContent, 200)
                        ->header('Content-Type', $mimeType)
                        ->header('Content-Disposition', 'inline; filename="' . basename($file) . '"')
                        ->header('Cache-Control', 'public, max-age=31536000')
                        ->header('Access-Control-Allow-Origin', '*');
                }
            }

            // If we get here, the file doesn't exist
            $directoryContents = is_dir($storagePath) ? scandir($storagePath) : [];
            
            \Log::error('File not found', [
                'requested' => $requestedPath,
                'directory' => $storagePath,
                'available_files' => $directoryContents
            ]);
            
            return response()->json([
                'error' => 'File not found',
                'requested' => $filename,
                'available' => array_values(array_filter($directoryContents, function($item) {
                    return !in_array($item, ['.', '..']);
                })),
                'directory' => $basePath
            ], 404);
            
        } catch (\Exception $e) {
            \Log::error('Error serving PDF: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            
            return response()->json([
                'error' => 'Error serving file',
                'message' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTrace() : null
            ], 500);
        }
    }
}
