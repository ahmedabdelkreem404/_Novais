<?php

namespace App\Services;

use App\Models\User;
use App\Models\Course;
use Carbon\Carbon;

class SubscriptionService
{
    public const PAID_STATUSES = [
        'premium',
        'manual_premium',
        'pro',
        'pro_monthly',
        'pro_yearly',
        'elite',
        'elite_monthly',
        'elite_yearly',
    ];

    public function isPaidStatus(?string $status): bool
    {
        return in_array($status, self::PAID_STATUSES, true);
    }

    /**
     * Get the current plan limits and prices from configuration.
     */
    public function getPlanConfigs()
    {
        $plans = \App\Models\Plan::all();
        $configs = [];

        foreach ($plans as $plan) {
            $configs[$plan->slug] = [
                'name' => $plan->name,
                'limit' => $plan->course_limit,
                'price' => $plan->price_egp,
            ];
        }

        // Fallback if table is empty
        if (empty($configs)) {
            return [
                'free' => ['name' => 'Free Plan', 'limit' => (int) env('FREE_PLAN_LIMIT', 1), 'price' => 0],
                'pro' => ['name' => 'Pro Plan', 'limit' => (int) env('PRO_PLAN_LIMIT', 3), 'price' => (int) env('PRO_PLAN_PRICE', 50)],
                'elite' => ['name' => 'Elite Plan', 'limit' => (int) env('ELITE_PLAN_LIMIT', -1), 'price' => (int) env('ELITE_PLAN_PRICE', 80)],
            ];
        }

        return $configs;
    }

    /**
     * Get user's current subscription details and usage.
     */
    public function getUserUsage(User $user)
    {
        $configs = $this->getPlanConfigs();
        $subStatus = $user->sub_status ?: 'free';
        $planKey = 'free';
        
        if (str_contains(strtolower($subStatus), 'pro')) $planKey = 'pro';
        if (str_contains(strtolower($subStatus), 'elite')) $planKey = 'elite';
        
        // Final safety check: if planKey doesn't exist in configs, fallback to free
        if (!isset($configs[$planKey])) {
            $planKey = 'free';
        }

        $plan = $configs[$planKey];
        $startDate = $user->subscription_started_at ?: $user->created_at;
        
        // Calculate the start of the current billing cycle
        $now = Carbon::now();
        $cycleStart = Carbon::parse($startDate);
        
        // Reset cycle start to current month, keeping the original day
        $currentCycleStart = $now->copy()->day($cycleStart->day);
        if ($currentCycleStart->gt($now)) {
            $currentCycleStart->subMonth();
        }

        // --- ADMIN BYPASS (Unlimited Limit but Track Usage) ---
        if ($user->role === 'admin') {
             $coursesCreated = Course::where('user_id', $user->id)
                ->where('created_at', '>=', $currentCycleStart)
                ->count();

             return [
                'plan_name' => 'Admin Access',
                'price' => 0,
                'limit' => -1, // Unlimited
                'used' => $coursesCreated,
                'remaining' => -1, // Unlimited
                'renewal_date' => $currentCycleStart->copy()->addYears(100)->toDateString(),
                'monthly_spent' => 0,
            ];
        }


        $coursesCreated = Course::where('user_id', $user->id)
            ->where('created_at', '>=', $currentCycleStart)
            ->count();

        return [
            'plan_name' => $plan['name'],
            'price' => $plan['price'],
            'limit' => $plan['limit'],
            'used' => $coursesCreated,
            'remaining' => $plan['limit'] === -1 ? -1 : max(0, $plan['limit'] - $coursesCreated),
            'renewal_date' => $currentCycleStart->copy()->addMonth()->toDateString(),
            'monthly_spent' => $user->monthly_spent_egp,
        ];
    }

    /**
     * Check if the user can create a new full course.
     */
    public function canCreateCourse(User $user)
    {
        $usage = $this->getUserUsage($user);
        if ($usage['limit'] === -1) {
            return true;
        }
        return $usage['used'] < $usage['limit'];
    }

    /**
     * Mark a course as fully completed and update tracking.
     */
    public function markCourseAsCompleted(Course $course)
    {
        if ($course->is_full_course) {
            return;
        }

        // Check if it has all lessons and at least one quiz
        $hasLessons = $course->lessons()->count() > 0;
        $hasQuiz = $course->quizzes()->count() > 0;

        if ($hasLessons && $hasQuiz) {
            $course->update([
                'is_full_course' => true,
                'full_completed_at' => Carbon::now(),
            ]);
            
            // Note: We don't deduct anything here because we check usage counts dynamically.
            // If we needed to track "spent" EGP per course, we could logic it here.
        }
    }
}
