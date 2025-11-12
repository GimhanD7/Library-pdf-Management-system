<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'original_filename' => $this->original_filename,
            'file_url' => $this->file_url,
            'file_size' => $this->file_size,
            'mime_type' => $this->mime_type,
            'year' => $this->year,
            'month' => $this->month,
            'day' => $this->day,
            'page' => $this->page,
            'created_at' => $this->created_at->toDateTimeString(),
            'updated_at' => $this->updated_at->toDateTimeString(),
        ];
    }
}
