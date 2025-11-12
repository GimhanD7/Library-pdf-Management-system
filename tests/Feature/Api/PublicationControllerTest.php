<?php

namespace Tests\Feature\Api;

use App\Models\Publication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicationControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user and generate a token
        $this->user = User::factory()->create();
        $this->token = $this->user->createToken('test-token')->plainTextToken;
        
        // Fake the S3 storage
        Storage::fake('s3');
    }

    /** @test */
    public function it_can_upload_a_publication()
    {
        // Create a fake PDF file
        $file = UploadedFile::fake()->create('document.pdf', 1000, 'application/pdf');
        
        // Test data
        $data = [
            'title' => 'Test Publication',
            'description' => 'This is a test publication',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
            'page' => 1,
            'file' => $file,
        ];
        
        // Send the request
        $response = $this->withToken($this->token)
            ->postJson('/api/publications', $data);
        
        // Assert the response
        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'description',
                    'original_filename',
                    'file_url',
                    'file_size',
                    'mime_type',
                    'year',
                    'month',
                    'day',
                    'page',
                    'created_at',
                    'updated_at',
                ]
            ]);
        
        // Assert the file was stored
        $publication = Publication::first();
        Storage::disk('s3')->assertExists($publication->file_path);
        
        // Assert the database has the record
        $this->assertDatabaseHas('publications', [
            'title' => 'Test Publication',
            'user_id' => $this->user->id,
            'year' => 2023,
            'month' => 7,
            'day' => 22,
            'page' => 1,
        ]);
    }
    
    /** @test */
    public function it_validates_upload_request()
    {
        // Send an invalid request (missing required fields)
        $response = $this->withToken($this->token)
            ->postJson('/api/publications', []);
            
        // Assert validation errors
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'year', 'month', 'day', 'file']);
    }
    
    /** @test */
    public function it_lists_publications()
    {
        // Create some test publications
        $publications = Publication::factory()
            ->count(3)
            ->for($this->user)
            ->create();
        
        // Send the request
        $response = $this->withToken($this->token)
            ->getJson('/api/publications');
            
        // Assert the response
        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'description',
                        'original_filename',
                        'file_url',
                        'file_size',
                        'mime_type',
                        'year',
                        'month',
                        'day',
                        'page',
                        'created_at',
                        'updated_at',
                    ]
                ],
                'links' => [
                    'first', 'last', 'prev', 'next'
                ],
                'meta' => [
                    'current_page', 'from', 'last_page', 'links', 'path',
                    'per_page', 'to', 'total'
                ]
            ]);
    }
    
    /** @test */
    public function it_filters_publications_by_year_and_month()
    {
        // Create test publications for different dates
        $publication1 = Publication::factory()
            ->for($this->user)
            ->publishedOn('2023-07-15')
            ->create();
            
        $publication2 = Publication::factory()
            ->for($this->user)
            ->publishedOn('2023-06-20')
            ->create();
            
        $publication3 = Publication::factory()
            ->for($this->user)
            ->publishedOn('2022-07-10')
            ->create();
        
        // Filter by year 2023
        $response = $this->withToken($this->token)
            ->getJson('/api/publications?year=2023');
            
        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
            
        // Filter by year 2023 and month 7
        $response = $this->withToken($this->token)
            ->getJson('/api/publications?year=2023&month=7');
            
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $publication1->id);
    }
    
    /** @test */
    public function it_shows_a_publication()
    {
        // Create a test publication
        $publication = Publication::factory()
            ->for($this->user)
            ->create();
        
        // Send the request
        $response = $this->withToken($this->token)
            ->getJson("/api/publications/{$publication->id}");
            
        // Assert the response
        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $publication->id,
                    'title' => $publication->title,
                ]
            ]);
    }
    
    /** @test */
    public function it_prevents_viewing_other_users_publications()
    {
        // Create a publication by a different user
        $otherUser = User::factory()->create();
        $publication = Publication::factory()
            ->for($otherUser)
            ->create();
        
        // Try to view the publication
        $response = $this->withToken($this->token)
            ->getJson("/api/publications/{$publication->id}");
            
        // Assert access is denied
        $response->assertStatus(403);
    }
    
    /** @test */
    public function it_deletes_a_publication()
    {
        // Create a test publication with a file
        $publication = Publication::factory()
            ->for($this->user)
            ->create();
            
        // Create a fake file in storage
        Storage::disk('s3')->put($publication->file_path, 'test content');
        
        // Send the delete request
        $response = $this->withToken($this->token)
            ->deleteJson("/api/publications/{$publication->id}");
            
        // Assert the response
        $response->assertStatus(200)
            ->assertJson(['message' => 'Publication deleted successfully']);
            
        // Assert the file was deleted
        Storage::disk('s3')->assertMissing($publication->file_path);
        
        // Assert the database record was deleted
        $this->assertDatabaseMissing('publications', ['id' => $publication->id]);
    }
    
    /** @test */
    public function it_prevents_deleting_other_users_publications()
    {
        // Create a publication by a different user
        $otherUser = User::factory()->create();
        $publication = Publication::factory()
            ->for($otherUser)
            ->create();
            
        // Create a fake file in storage
        Storage::disk('s3')->put($publication->file_path, 'test content');
        
        // Try to delete the publication
        $response = $this->withToken($this->token)
            ->deleteJson("/api/publications/{$publication->id}");
            
        // Assert access is denied
        $response->assertStatus(403);
        
        // Assert the file still exists
        Storage::disk('s3')->assertExists($publication->file_path);
        
        // Assert the database record still exists
        $this->assertDatabaseHas('publications', ['id' => $publication->id]);
    }
}
