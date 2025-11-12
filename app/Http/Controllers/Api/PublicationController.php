<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePublicationRequest;
use App\Http\Resources\PublicationResource;
use App\Models\Publication;
use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicationController extends Controller
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }
    
    /**
     * Test S3 connection and file upload
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function testS3()
    {
        try {
            // Test S3 connection by creating a test file
            $testContent = 'Test file content - ' . now()->toDateTimeString();
            $testPath = 'test-files/test-' . uniqid() . '.txt';
            
            // Write to S3
            Storage::disk('s3')->put($testPath, $testContent);
            
            // Read back from S3
            $storedContent = Storage::disk('s3')->get($testPath);
            
            // Delete test file
            Storage::disk('s3')->delete($testPath);
            
            return response()->json([
                'success' => true,
                'message' => 'S3 connection successful!',
                'test_content' => $testContent,
                'stored_content' => $storedContent,
                'files_in_bucket' => Storage::disk('s3')->files('test-files')
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'S3 connection failed',
                'error' => $e->getMessage(),
                'aws_config' => [
                    'bucket' => config('filesystems.disks.s3.bucket'),
                    'region' => config('filesystems.disks.s3.region'),
                    'key' => config('filesystems.disks.s3.key') ? 'set' : 'not set',
                    'secret' => config('filesystems.disks.s3.secret') ? 'set' : 'not set',
                ]
            ], 500);
        }
    }

    /**
     * Store a newly created publication in storage.
     *
     * @param  StorePublicationRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StorePublicationRequest $request, FileUploadService $fileUploadService)
    {
        try {
            // Get validated data
            $validated = $request->validated();
            
            // Process the file upload (will be handled in the background)
            $publication = $fileUploadService->uploadPublication(
                $validated,
                $request->file('file'),
                true // Process in background
            );
            
            // If we're processing in the background, the job will handle the rest
            if ($publication instanceof \Illuminate\Foundation\Bus\PendingDispatch) {
                return response()->json([
                    'message' => 'File upload has been queued for processing',
                    'status' => 'queued'
                ], 202);
            }
            
            // If we get here, the file was processed synchronously
            return (new PublicationResource($publication))
                ->response()
                ->setStatusCode(201);
                
        } catch (\Exception $e) {
            \Log::error('File upload failed: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => auth()->id(),
                'file' => $request->file('file') ? $request->file('file')->getClientOriginalName() : null
            ]);
            
            return response()->json([
                'message' => 'Failed to upload file',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while uploading the file'
            ], 500);
        }
    }

    /**
     * Display a listing of the publications.
     *
     * @param  Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    /**
     * Display a listing of the publications.
     *
     * @param  Request  $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $request->user()->publications()
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->orderBy('day', 'desc');

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        if ($request->has('month')) {
            $query->where('month', $request->month);
        }

        $publications = $query->paginate(15);

        return PublicationResource::collection($publications);
    }

    /**
     * Remove the specified publication from storage.
     *
     * @param  Publication  $publication
     * @return \Illuminate\Http\JsonResponse
     */
    /**
     * Remove the specified publication from storage.
     *
     * @param  Publication  $publication
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Publication $publication)
    {
        $this->authorize('delete', $publication);

        try {
            $this->fileUploadService->deletePublication($publication);

            return response()->json([
                'message' => 'Publication deleted successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete publication',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
