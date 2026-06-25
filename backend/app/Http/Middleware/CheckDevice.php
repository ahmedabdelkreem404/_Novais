<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckDevice
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $deviceId = $request->header('X-Device-ID') ?: $request->query('device_id');
        
        if (!$deviceId) {
            return response()->json(['success' => false, 'message' => 'auth.device_id_required'], 403);
        }

        $user = auth('api')->user();
        if (!$user) return $next($request);

        $deviceManager = app(\App\Services\DeviceManager::class);

        // Security check: If route is course generation
        if ($request->is('api/generate-course')) {
            if (!$deviceManager->checkGenerationLimits($user, $deviceId)) {
                return response()->json([
                    'success' => false, 
                    'message' => 'auth.generation_limit_reached'
                ], 429);
            }
        }

        // Add device_id to request so controllers can use it easily
        $request->merge(['device_id' => $deviceId]);

        return $next($request);
    }
}
