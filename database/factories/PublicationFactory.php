<?php

namespace Database\Factories;

use App\Models\Publication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Publication>
 */
class PublicationFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Publication::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $year = $this->faker->numberBetween(2000, date('Y'));
        $month = $this->faker->numberBetween(1, 12);
        $day = $this->faker->numberBetween(1, 28); // Using 28 to avoid month/day issues
        
        $filename = sprintf(
            'publications/document_%s_%s.pdf',
            $this->faker->unique()->md5,
            now()->timestamp
        );
        
        return [
            'title' => $this->faker->sentence,
            'description' => $this->faker->optional()->paragraph,
            'original_filename' => $this->faker->word . '.pdf',
            'file_path' => $filename,
            'file_url' => 'https://example.com/' . $filename,
            'mime_type' => 'application/pdf',
            'file_size' => $this->faker->numberBetween(1000, 1000000), // 1KB to 1MB
            'year' => $year,
            'month' => $month,
            'day' => $day,
            'page' => $this->faker->optional()->numberBetween(1, 1000),
            'user_id' => User::factory(),
        ];
    }
    
    /**
     * Configure the model factory to use a specific user.
     *
     * @param  int|\App\Models\User  $user
     * @return $this
     */
    public function forUser($user)
    {
        return $this->state(function (array $attributes) use ($user) {
            return [
                'user_id' => $user instanceof User ? $user->id : $user,
            ];
        });
    }
    
    /**
     * Set the publication date.
     *
     * @param  string|\DateTime  $date
     * @return $this
     */
    public function publishedOn($date)
    {
        $date = is_string($date) ? new \DateTime($date) : $date;
        
        return $this->state([
            'year' => (int) $date->format('Y'),
            'month' => (int) $date->format('m'),
            'day' => (int) $date->format('d'),
        ]);
    }
}
