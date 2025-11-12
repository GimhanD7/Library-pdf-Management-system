<?php

namespace Tests\Unit\Services;

use App\Models\Publication;
use App\Services\FileUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileUploadServiceTest extends TestCase
{
    use RefreshDatabase;

    /** @var FileUploadService */
    protected $fileUploadService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Set up the test environment
        Storage::fake('s3');
        
        // Create a test user
        $this->user = \App\Models\User::factory()->create();
        
        // Create an instance of the service
        $this->fileUploadService = new FileUploadService();
        $this->fileUploadService->setDisk('s3');
        $this->fileUploadService->setDirectory('test-uploads');
        
        // Set the authenticated user
        $this->actingAs($this->user);
    }

    /** @test */
    public function it_can_upload_a_file()
    {
        // Create a fake PDF file
        $file = UploadedFile::fake()->create('document.pdf', 1000, 'application/pdf');
        
        // Test data
        $data = [
            'title' => 'Test Document',
            'description' => 'Test Description',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
            'page' => 1,
        ];
        
        // Execute the service
        $publication = $this->fileUploadService->uploadPublication($data, $file, false);
        
        // Assert the file was stored
        Storage::disk('s3')->assertExists($publication->file_path);
        
        // Assert the database has the record
        $this->assertDatabaseHas('publications', [
            'id' => $publication->id,
            'title' => 'Test Document',
            'original_filename' => 'document.pdf',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
            'page' => 1,
            'user_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function it_validates_file_type()
    {
        // Create a fake invalid file
        $file = UploadedFile::fake()->create('document.txt', 1000, 'text/plain');
        
        // Test data
        $data = [
            'title' => 'Test Document',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
        ];
        
        // Expect exception
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('File type not allowed');
        
        // Execute the service
        $this->fileUploadService->uploadPublication($data, $file, false);
    }

    /** @test */
    public function it_validates_file_size()
    {
        // Create a fake file that's too large (15MB)
        $file = UploadedFile::fake()->create('document.pdf', 15000, 'application/pdf');
        
        // Test data
        $data = [
            'title' => 'Test Document',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
        ];
        
        // Expect exception
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('File size exceeds');
        
        // Execute the service
        $this->fileUploadService->uploadPublication($data, $file, false);
    }

    /** @test */
    public function it_can_delete_a_publication()
    {
        // Create a test publication
        $publication = \App\Models\Publication::create([
            'title' => 'Test Document',
            'original_filename' => 'document_test.pdf',
            'file_path' => 'test-uploads/document_test.pdf',
            'file_url' => 'https://example.com/test-uploads/document_test.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1000,
            'year' => 2023,
            'month' => 7,
            'day' => 22,
            'page' => 1,
            'user_id' => $this->user->id,
        ]);
        
        // Create a fake file in storage
        Storage::disk('s3')->put($publication->file_path, 'test content');
        
        // Execute the service
        $result = $this->fileUploadService->deletePublication($publication);
        
        // Assert the file was deleted
        Storage::disk('s3')->assertMissing($publication->file_path);
        
        // Assert the database record was deleted
        $this->assertDatabaseMissing('publications', ['id' => $publication->id]);
    }

    /** @test */
    public function it_generates_unique_filenames()
    {
        $originalName = 'Test Document.pdf';
        
        // Use reflection to access the protected method
        $reflection = new \ReflectionClass($this->fileUploadService);
        $method = $reflection->getMethod('generateFileName');
        $method->setAccessible(true);
        
        // Generate two filenames and ensure they're different
        $name1 = $method->invokeArgs($this->fileUploadService, [$originalName]);
        $name2 = $method->invokeArgs($this->fileUploadService, [$originalName]);
        
        $this->assertNotEquals($name1, $name2);
        $this->assertStringStartsWith('test-document_', $name1);
        $this->assertStringEndsWith('.pdf', $name1);
    }
}
