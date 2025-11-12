<?php

namespace Tests\Unit\Http\Requests;

use App\Http\Requests\StorePublicationRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class StorePublicationRequestTest extends TestCase
{
    /** @test */
    public function it_validates_required_fields()
    {
        $request = new StorePublicationRequest();
        
        $validator = Validator::make([], $request->rules(), $request->messages());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('title', $validator->errors()->toArray());
        $this->assertArrayHasKey('year', $validator->errors()->toArray());
        $this->assertArrayHasKey('month', $validator->errors()->toArray());
        $this->assertArrayHasKey('day', $validator->errors()->toArray());
        $this->assertArrayHasKey('file', $validator->errors()->toArray());
        
        // Check the error messages
        $errors = $validator->errors();
        $this->assertEquals('Please select a file to upload', $errors->first('file'));
        $this->assertEquals('Please enter a title', $errors->first('title'));
        $this->assertEquals('Please enter a valid year', $errors->first('year'));
        $this->assertEquals('Please enter a valid month', $errors->first('month'));
        $this->assertEquals('Please enter a valid day', $errors->first('day'));
    }
    
    /** @test */
    public function it_validates_file_types()
    {
        $request = new StorePublicationRequest();
        
        // Invalid file type
        $file = UploadedFile::fake()->create('document.txt', 1000, 'text/plain');
        
        $data = [
            'title' => 'Test Document',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
            'file' => $file,
        ];
        
        $validator = Validator::make($data, $request->rules(), $request->messages());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('file', $validator->errors()->toArray());
        $this->assertEquals('The file must be a PDF', $validator->errors()->first('file'));
    }
    
    /** @test */
    public function it_validates_file_size()
    {
        $request = new StorePublicationRequest();
        
        // File too large (15MB)
        $file = UploadedFile::fake()->create('document.pdf', 15000, 'application/pdf');
        
        $data = [
            'title' => 'Test Document',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
            'file' => $file,
        ];
        
        $validator = Validator::make($data, $request->rules(), $request->messages());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('file', $validator->errors()->toArray());
        $this->assertEquals('The file may not be greater than 10MB', $validator->errors()->first('file'));
    }
    
    /** @test */
    public function it_validates_date_fields()
    {
        $request = new StorePublicationRequest();
        
        $file = UploadedFile::fake()->create('document.pdf', 1000, 'application/pdf');
        
        // Invalid dates
        $data = [
            'title' => 'Test Document',
            'year' => 'invalid',
            'month' => 13, // Invalid month
            'day' => 32,  // Invalid day
            'file' => $file,
        ];
        
        $validator = Validator::make($data, $request->rules(), $request->messages());
        
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('year', $validator->errors()->toArray());
        $this->assertArrayHasKey('month', $validator->errors()->toArray());
        $this->assertArrayHasKey('day', $validator->errors()->toArray());
    }
    
    /** @test */
    public function it_passes_validation_with_valid_data()
    {
        $request = new StorePublicationRequest();
        
        $file = UploadedFile::fake()->create('document.pdf', 1000, 'application/pdf');
        
        $data = [
            'title' => 'Test Document',
            'description' => 'This is a test document',
            'year' => 2023,
            'month' => 7,
            'day' => 22,
            'page' => 1,
            'file' => $file,
        ];
        
        $validator = Validator::make($data, $request->rules(), $request->messages());
        
        $this->assertFalse($validator->fails());
    }
}
