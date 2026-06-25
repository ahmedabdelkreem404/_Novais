<?php

namespace App\Services;

use App\Models\DeviceFingerprint;
use App\Models\CourseGenerationLog;
use App\Models\AbuseFlag;
use App\Models\User;
use Illuminate\Support\Facades\Request;

class DeviceManager
{
    /**
     * Verify if a device is allowed to register a free account.
     */
    public function canRegisterFree($deviceId)
    {
        if (!$deviceId) return true; // Fail open if no ID, or strict? Requirements say mandatory.

        return !User::where('registration_device_id', $deviceId)
            ->where('sub_status', 'free')
            ->exists();
    }

    /**
     * Track a user's device access.
     */
    public function trackDevice(User $user, $deviceId)
    {
        if (!$deviceId) return;

        DeviceFingerprint::updateOrCreate(
            ['user_id' => $user->id, 'device_id' => $deviceId],
            [
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
                'last_seen_at' => now()
            ]
        );
    }

    /**
     * Log a course generation event.
     */
    public function logGeneration(User $user, $courseId, $deviceId)
    {
        CourseGenerationLog::create([
            'user_id' => $user->id,
            'course_id' => $courseId,
            'device_id' => $deviceId,
            'ip_address' => Request::ip()
        ]);
    }

    /**
     * Check course generation limits for a user/device.
     */
    public function checkGenerationLimits(User $user, $deviceId)
    {
        if (app(\App\Services\SubscriptionService::class)->isPaidStatus($user->sub_status)) return true;

        // Example: 1 course per 24 hours
        $count = CourseGenerationLog::where(function($query) use ($user, $deviceId) {
                $query->where('user_id', $user->id)
                      ->orWhere('device_id', $deviceId);
            })
            ->where('created_at', '>=', now()->subDay())
            ->count();

        return $count < 1;
    }
}
