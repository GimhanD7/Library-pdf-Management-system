<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;

class PublicationController extends Controller
{
    /**
     * View a PDF file in the browser.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function view($id)
    {
        \Log::info('View method called with ID: ' . $id);
        
        try {
            $publication = \App\Models\Publication::find($id);
            
            if (!$publication) {
                \Log::error('Publication not found with ID: ' . $id);
                abort(404, 'Publication not found');
            }
            
            \Log::info('Publication found:', [
                'id' => $publication->id,
                'title' => $publication->title,
                'file_path' => $publication->file_path,
                'original_filename' => $publication->original_filename
            ]);
            
            // Check if file path exists and is not null
            if (empty($publication->file_path)) {
                $error = 'File path is not set for this publication';
                \Log::error($error, ['publication_id' => $publication->id]);
                abort(404, $error);
            }

            // Check if the file exists in storage
            $storage = Storage::disk('public');
            $filePath = ltrim($publication->file_path, '/'); // Remove leading slash if present
        
            if (!$storage->exists($filePath)) {
                $error = 'File not found in storage at path: ' . $filePath;
                \Log::error($error, [
                    'publication_id' => $publication->id,
                    'storage_path' => $storage->path($filePath),
                    'full_disk_path' => storage_path('app/public/' . $filePath)
                ]);
                abort(404, $error);
            }

            // Get the file content
            $fileContent = $storage->get($filePath);
            
            if ($fileContent === false) {
                $error = 'Could not read file content';
                \Log::error($error, [
                    'file_path' => $filePath,
                    'storage_path' => $storage->path($filePath)
                ]);
                abort(500, $error);
            }
            
            // Get the MIME type with a fallback
            $mimeType = $storage->mimeType($filePath) ?? 'application/pdf';
            
            // Get the original filename with a fallback
            $filename = $publication->original_filename ?? 'document.pdf';
            
            // Log successful file retrieval
            \Log::info('Serving file', [
                'publication_id' => $publication->id,
                'filename' => $filename,
                'mime_type' => $mimeType
            ]);
            
            // Return the file as a response with appropriate headers
            return response($fileContent, 200, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $filename . '"',
                'Cache-Control' => 'public, max-age=31536000',
            ]);
            
        } catch (\Exception $e) {
            $error = 'Error in view method: ' . $e->getMessage();
            \Log::error($error, [
                'exception' => $e,
                'publication_id' => $publication->id ?? null,
                'file_path' => $publication->file_path ?? null
            ]);
            abort(500, $error);
        }
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('publications/create');
    }

    /**
     * Upload a file and return its storage information.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadFile(Request $request)
    {
        // Validate the incoming file
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $filename = basename($originalName);
        
        // Extract name from filename (everything before the first dash)
        $name = trim(explode('-', pathinfo($filename, PATHINFO_FILENAME))[0]);
        
        // Extract date and page information from filename
        $match = preg_match('/(\d{4})-(\d{2})-(\d{2})/', $filename, $matches);
        
        $data = [
            'title' => $name, // Set the title from the extracted name
        ];
        
        // Add parsed date information to data
        $now = now();
        if ($match) {
            $data['year'] = $matches[1];
            $data['month'] = $matches[2];
            $data['day'] = $matches[3];
            
            // Extract page number if present (format: -0006.pdf)
            preg_match('/-(\d+)(?=\.PDF$)/i', $filename, $pageMatches);
            if (!empty($pageMatches)) {
                $data['page'] = (int)$pageMatches[1];
            }
        } else {
            // If no date in filename, use current date
            $data['year'] = $now->year;
            $data['month'] = $now->month;
            $data['day'] = $now->day;
        }

        // Create storage path: publications/name/year/month/day
        $storagePath = sprintf(
            'publications/%s/%d/%02d/%02d',
            Str::slug($name),
            $data['year'],
            $data['month'],
            $data['day']
        );
        
        // Ensure the directory exists
        if (!Storage::disk('public')->exists($storagePath)) {
            Storage::disk('public')->makeDirectory($storagePath, 0755, true);
        }
        
        // Calculate file hash for duplicate detection
        $fileHash = hash_file('sha256', $file->path());
        
        // Check for existing files with the same content
        $existingFile = null;
        $files = Storage::disk('public')->allFiles($storagePath);
        
        foreach ($files as $existingFilePath) {
            if (hash_file('sha256', Storage::disk('public')->path($existingFilePath)) === $fileHash) {
                $existingFile = $existingFilePath;
                break;
            }
        }
        
        // If a file with the same content exists, return its information
        if ($existingFile) {
            return response()->json([
                'success' => true,
                'message' => 'A file with the same content already exists',
                'data' => [
                    'original_filename' => basename($existingFile),
                    'file_path' => $existingFile,
                    'file_url' => Storage::disk('public')->url($existingFile),
                    'mime_type' => mime_content_type(Storage::disk('public')->path($existingFile)),
                    'file_size' => Storage::disk('public')->size($existingFile),
                    'year' => $data['year'] ?? null,
                    'month' => $data['month'] ?? null,
                    'day' => $data['day'] ?? null,
                    'page' => $data['page'] ?? null,
                    'duplicate' => true
                ]
            ], 200);
        }
        
        // If file with same name exists but different content, append a timestamp
        $filePath = $storagePath . '/' . $filename;
        if (Storage::disk('public')->exists($filePath)) {
            $filename = pathinfo($filename, PATHINFO_FILENAME) . '_' . $now->timestamp . '.' . pathinfo($filename, PATHINFO_EXTENSION);
            $filePath = $storagePath . '/' . $filename;
        }
        
        // Store the file with its original name (or modified name if duplicate) in the appropriate directory
        $path = $file->storeAs(
            $storagePath,
            $filename,
            'public'
        );

        // Generate public URL for the stored file
        $url = Storage::disk('public')->url($path);

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => [
                'original_filename' => $originalName,
                'file_path' => $path,
                'file_url' => $url,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'year' => $data['year'] ?? null,
                'month' => $data['month'] ?? null,
                'day' => $data['day'] ?? null,
                'page' => $data['page'] ?? null,
                'duplicate' => false
            ]
        ], 201);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request
        $validated = $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'publication_date' => 'required|date',
            'year' => 'nullable|integer',
            'month' => 'nullable|integer|between:1,12',
            'day' => 'nullable|integer|between:1,31',
            'page' => 'nullable|integer',
        ]);

        $file = $request->file('file');
        $filename = $file->getClientOriginalName();

        try {
            // Check for existing file
            $existingFile = auth()->user()->publications()
                ->where('original_filename', $filename)
                ->first();
            
            if ($existingFile) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'A file with this name already exists: ' . $filename,
                    'data' => null
                ], 400);
            }

            // Prepare file data
            $title = $request->input('title') ?? pathinfo($filename, PATHINFO_FILENAME);
            $year = $request->input('year');
            $month = $request->input('month');
            $day = $request->input('day');

            // Create storage path
            $year = $year ? str_pad($year, 4, '0', STR_PAD_LEFT) : date('Y');
            $month = $month ? str_pad($month, 2, '0', STR_PAD_LEFT) : date('m');
            $day = $day ? str_pad($day, 2, '0', STR_PAD_LEFT) : date('d');
            
            $storagePath = "publications/{$year}/{$month}/{$day}";
            
            // Ensure directory exists
            if (!Storage::disk('public')->exists($storagePath)) {
                Storage::disk('public')->makeDirectory($storagePath, 0755, true);
            }
            
            // Store the file
            $path = $file->storeAs(
                $storagePath,
                $filename,
                'public'
            );

            // Create publication record
            $publication = auth()->user()->publications()->create([
                'title' => $title,
                'description' => $request->input('description', ''),
                'original_filename' => $filename,
                'file_path' => $path,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'year' => $year ? (int)$year : null,
                'month' => $month ? (int)$month : null,
                'day' => $day ? (int)$day : null,
                'page' => $request->input('page')
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'File uploaded successfully',
                'data' => $publication
            ]);
        } catch (\Exception $e) {
            \Log::error('Error uploading file: ' . $e->getMessage(), [
                'exception' => $e,
                'file' => $filename
            ]);
            
            return response()->json([
                'status' => 'error',
        $files = $request->file('files');
        $results = [];

        foreach ($files as $file) {
            try {
                // Extract information from filename
                $filename = $file->getClientOriginalName();
                $match = preg_match('/(\d{4})-(\d{2})-(\d{2})/', $filename, $matches);
                
                // Check if a file with the same original_filename already exists
                $existingFile = auth()->user()->publications()
                    ->where('original_filename', $filename)
                    ->first();
                
                if ($existingFile) {
                    $results[] = [
                        'status' => 'error',
                        'message' => 'A file with the same name already exists: ' . $filename,
                        'data' => null
                    ];
                    continue; // Skip to next file
                }
                
                $data = $request->validate([
                    'title' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'publication_date' => 'required|date',
                ]);

                // Add parsed information to data
                if ($match) {
                    $data['year'] = $matches[1];
                    $data['month'] = $matches[2];
                    $data['day'] = $matches[3];
                    
                    // Extract page number if present
                    preg_match('/-(\d+)(?=\.PDF$)/i', $filename, $pageMatches);
                    if (!empty($pageMatches)) {
                        $data['page_count'] = $pageMatches[1];
                    }
                }

                $result = $this->processFileUpload($file, $data);
                $results[] = [
                    'status' => 'success',
                    'message' => 'File uploaded successfully',
                    'data' => $result
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'status' => 'error',
                    'message' => $e->getMessage(),
                    'data' => null
                ];
            }
        }

        return response()->json([
            'results' => $results
        ], 200);
    }

    /**
     * Process file upload and return file info
            'url' => route('publication.file', ['id' => $publication->id])
        ];
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }


    /**
     * Download a publication file
     */
    public function download($id)
    {
        $publication = Publication::findOrFail($id);
        
        // Generate the file path based on the publication data
        $filePath = sprintf(
            'public/publications/%s/%s/%s/%s/%s/%s.%s',
            $publication->title,
            $publication->year,
            str_pad($publication->month, 2, '0', STR_PAD_LEFT),
            str_pad($publication->day, 2, '0', STR_PAD_LEFT),
            $publication->page_count,
            $publication->id,
            pathinfo($publication->original_filename, PATHINFO_EXTENSION) ?: 'pdf'
        );
        
        $fullPath = storage_path('app/' . $filePath);
        
        if (!file_exists($fullPath)) {
            abort(404, 'File not found');
        }
        
        return response()->download($fullPath, $publication->original_filename);
    }
    
    public function destroy(string $id)
    {
        //
    }
}
