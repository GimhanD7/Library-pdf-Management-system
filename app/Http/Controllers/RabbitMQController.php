<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessRabbitMQJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RabbitMQController extends Controller
{
    /**
     * Send a message to RabbitMQ queue
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'delay' => 'sometimes|integer|min:0',
        ]);

        try {
            $job = new ProcessRabbitMQJob($validated['message']);
            
            // Add delay if specified
            if (isset($validated['delay']) && $validated['delay'] > 0) {
                $job->delay(now()->addSeconds($validated['delay']));
            }
            
            // Dispatch the job to the RabbitMQ queue
            dispatch($job)->onQueue('default');
            
            return response()->json([
                'success' => true,
                'message' => 'Message sent to RabbitMQ queue',
                'data' => [
                    'message' => $validated['message'],
                    'delayed_seconds' => $validated['delay'] ?? 0,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send message to RabbitMQ: ' . $e->getMessage(), [
                'exception' => $e,
                'message' => $validated['message'] ?? null,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message to RabbitMQ',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Process messages from RabbitMQ
     * This is typically handled by the queue worker, but you can call it directly for testing
     * 
     * @param  string  $message
     * @return array
     */
    public function processMessage($message)
    {
        try {
            // Process the message here
            Log::info('Processing message from RabbitMQ', ['message' => $message]);
            
            return [
                'success' => true,
                'message' => 'Message processed successfully',
                'data' => $message
            ];
            
        } catch (\Exception $e) {
            Log::error('Error processing RabbitMQ message: ' . $e->getMessage(), [
                'exception' => $e,
                'message' => $message,
            ]);
            
            throw $e;
        }
    }
}
