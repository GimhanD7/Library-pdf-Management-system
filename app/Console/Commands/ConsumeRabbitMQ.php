<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

class ConsumeRabbitMQ extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rabbitmq:consume {--queue= : The name of the queue to consume from}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Consume messages from RabbitMQ queue';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $queue = $this->option('queue') ?: config('queue.connections.rabbitmq.queue', 'default');
        
        $this->info("Starting RabbitMQ consumer for queue: {$queue}");
        
        try {
            $connection = new AMQPStreamConnection(
                config('queue.connections.rabbitmq.host', 'localhost'),
                config('queue.connections.rabbitmq.port', 5672),
                config('queue.connections.rabbitmq.login', 'guest'),
                config('queue.connections.rabbitmq.password', 'guest'),
                config('queue.connections.rabbitmq.vhost', '/')
            );
            
            $channel = $connection->channel();
            
            // Declare the queue
            $channel->queue_declare(
                $queue,
                false,
                config('queue.connections.rabbitmq.queue_params.durable', true),
                config('queue.connections.rabbitmq.queue_params.exclusive', false),
                config('queue.connections.rabbitmq.queue_params.auto_delete', false)
            );
            
            $this->info("Waiting for messages. To exit press CTRL+C\n");
            
            $callback = function ($message) {
                $this->info(" [x] Received " . $message->body);
                
                try {
                    // Process the message here
                    $this->processMessage($message->body);
                    
                    // Acknowledge the message
                    $message->ack();
                    $this->info(" [x] Processed");
                } catch (\Exception $e) {
                    $this->error("Error processing message: " . $e->getMessage());
                    Log::error('Error processing RabbitMQ message', [
                        'error' => $e->getMessage(),
                        'message' => $message->body,
                        'trace' => $e->getTraceAsString(),
                    ]);
                    
                    // Reject the message and requeue it
                    $message->nack(true);
                }
            };
            
            // Set QoS (quality of service) - prefetch count
            $channel->basic_qos(null, 1, null);
            
            // Start consuming
            $channel->basic_consume(
                $queue,
                '',
                false,
                false,
                false,
                false,
                $callback
            );
            
            while ($channel->is_consuming()) {
                $channel->wait();
            }
            
            $channel->close();
            $connection->close();
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error("Error: " . $e->getMessage());
            Log::error('RabbitMQ consumer error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return Command::FAILURE;
        }
    }
    
    /**
     * Process the received message
     *
     * @param string $message
     * @return void
     */
    protected function processMessage($message)
    {
        // Default processing - you can customize this method
        $this->info("Processing message: " . $message);
        
        // Example: Decode JSON message
        $data = json_decode($message, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Invalid JSON message: ' . json_last_error_msg());
        }
        
        // Here you can add your custom message processing logic
        // For example, dispatch a job or call a service
        // ProcessRabbitMQJob::dispatch($data);
        
        // Or process directly
        // $this->call('your:command', ['data' => $data]);
    }
}
