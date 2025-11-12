<?php

namespace Tests\Unit\Jobs;

use App\Jobs\ProcessFileUpload;
use App\Models\Publication;
use App\Services\FileUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Mockery;

class ProcessFileUploadTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_processes_file_upload()
    {
        // Create a test user
        $user = \App\Models\User::factory()->create();
        
        // Create a test file
        $file = UploadedFile::fake()->create('test.pdf', 1000, 'application/pdf');
        
        // Test data
        $data = [
            'title' => 'Test Document',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
        ];
        
        // Create a mock for the service with protected methods enabled
        $mockService = Mockery::mock(FileUploadService::class)->makePartial();
        $mockService->shouldAllowMockingProtectedMethods();
        $this->app->instance(FileUploadService::class, $mockService);
        
        // Create a mock publication
        $publication = new \App\Models\Publication($data + [
            'user_id' => $user->id,
            'file_path' => 'test-uploads/test.pdf',
            'file_url' => 'https://example.com/test-uploads/test.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1000,
            'original_filename' => 'test.pdf'
        ]);
        
        // Expect the service to be called with the correct parameters
        $mockService->shouldReceive('processUpload')
            ->with($data, $file)
            ->once()
            ->andReturn($publication);
        
        // Create and dispatch the job
        $job = new ProcessFileUpload($data, $file, $user->id);
        
        // Mock the auth facade
        $auth = Mockery::mock('auth');
        $auth->shouldReceive('onceUsingId')
            ->with($user->id)
            ->once();
        
        // Mock the log facade
        $log = Mockery::mock('log');
        $log->shouldReceive('info')
            ->with('File uploaded successfully', [
                'publication_id' => null,
                'file_path' => 'test-uploads/test.pdf',
                'user_id' => $user->id
            ])
            ->once();
        
        $this->app->instance('auth', $auth);
        $this->app->instance('log', $log);
        
        // Execute the job
        $result = $job->handle($mockService);
        
        // Assert the result is as expected
        $this->assertInstanceOf(\App\Models\Publication::class, $result);
        $this->assertEquals('Test Document', $result->title);
        $this->assertEquals('test-uploads/test.pdf', $result->file_path);
        $this->assertEquals('https://example.com/test-uploads/test.pdf', $result->file_url);
    }
    
    /** @test */
    public function it_handles_job_failure()
    {
        // Create a test file
        $file = UploadedFile::fake()->create('test.pdf', 1000, 'application/pdf');
        
        // Test data
        $data = [
            'title' => 'Test Document',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
        ];
        
        $userId = 1;
        $exception = new \Exception('Test exception');
        
        // Create a mock for the log facade
        $log = Mockery::mock('log');
        $log->shouldReceive('error')
            ->with('File upload job failed after all attempts', [
                'error' => 'Test exception',
                'file' => 'test.pdf',
                'user_id' => $userId
            ])
            ->once();
            
        $this->app->instance('log', $log);
        
        // Create the job
        $job = new ProcessFileUpload($data, $file, $userId);
        
        // Call the failed method
        $job->failed($exception);
        
        // No assertions needed as we're just testing that the error is logged
        $this->assertTrue(true);
    }
    
    /** @test */
    public function it_retries_on_failure()
    {
        // Create a test user
        $user = \App\Models\User::factory()->create();
        
        // Create a test file
        $file = UploadedFile::fake()->create('test.pdf', 1000, 'application/pdf');
        
        // Test data
        $data = [
            'title' => 'Test Document',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
        ];
        
        // Create a mock for the service with protected methods enabled
        $mockService = Mockery::mock(FileUploadService::class)->makePartial();
        $mockService->shouldAllowMockingProtectedMethods();
        $this->app->instance(FileUploadService::class, $mockService);
        
        // Make the service throw an exception
        $mockService->shouldReceive('processUpload')
            ->with($data, $file)
            ->once()
            ->andThrow(new \Exception('Test exception'));
            
        // Mock the auth facade
        $auth = Mockery::mock('auth');
        $auth->shouldReceive('onceUsingId')
            ->with($user->id)
            ->once();
            
        $this->app->instance('auth', $auth);
        
        // Create the job
        $job = new ProcessFileUpload($data, $file, $user->id);
        
        // Test the retry configuration
        $this->assertEquals(3, $job->tries);
        $this->assertEquals(10, $job->backoff[0]);
        $this->assertEquals(30, $job->backoff[1]);
        $this->assertEquals(60, $job->backoff[2]);
        
        // Expect an exception to be thrown
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Test exception');
        
        // Execute the job
        $job->handle($mockService);
    }
    
    protected function tearDown(): void
    {
        parent::tearDown();
        Mockery::close();
    }
}
