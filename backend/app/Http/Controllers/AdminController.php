<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function stats()
    {
        $currentMonth = now()->startOfMonth();
        $lastMonth = now()->subMonth()->startOfMonth();
        $endLastMonth = now()->subMonth()->endOfMonth();

        // Users Stats
        $totalUsers = User::count();
        $paidUsers = User::where('role', 'premium')
            ->orWhereIn('sub_status', \App\Services\SubscriptionService::PAID_STATUSES)
            ->count();
        $freeUsers = $totalUsers - $paidUsers;

        $usersThisMonth = User::where('created_at', '>=', $currentMonth)->count();
        $usersLastMonth = User::whereBetween('created_at', [$lastMonth, $endLastMonth])->count();
        $userTrend = $this->calculateTrend($usersThisMonth, $usersLastMonth);
        
        // Courses Stats
        $totalCourses = Course::count();
        $videoCourses = Course::whereIn('type', ['video', 'video_theory'])->count();
        $textCourses = Course::whereIn('type', ['text', 'audio', 'image', 'theory_image'])->count();

        $coursesThisMonth = Course::where('created_at', '>=', $currentMonth)->count();
        $coursesLastMonth = Course::whereBetween('created_at', [$lastMonth, $endLastMonth])->count();
        $courseTrend = $this->calculateTrend($coursesThisMonth, $coursesLastMonth);

        // Revenue Stats
        $totalRevenue = Payment::where('status', 'paid')->orWhere('status', 'successful')->sum('amount');
        
        $revenueThisMonth = Payment::whereIn('status', ['paid', 'successful'])
            ->where('created_at', '>=', $currentMonth)
            ->sum('amount');

        $revenueLastMonth = Payment::whereIn('status', ['paid', 'successful'])
            ->whereBetween('created_at', [$lastMonth, $endLastMonth])
            ->sum('amount');
            
        $revenueTrend = $this->calculateTrend($revenueThisMonth, $revenueLastMonth);
        $totalRevenueTrend = $revenueTrend; // Using same trend for total revenue for now as total historical trend is complex

        return response()->json([
            'users' => $totalUsers,
            'users_trend' => $userTrend,
            'paid' => $paidUsers,
            'free' => $freeUsers,
            'courses' => $totalCourses,
            'courses_trend' => $courseTrend,
            'videoType' => $videoCourses,
            'textType' => $textCourses,
            'total' => round($totalRevenue, 2),
            'total_trend' => $totalRevenueTrend,
            'sum' => round($revenueThisMonth, 2),
            'monthly_trend' => $revenueTrend
        ]);
    }

    private function calculateTrend($current, $previous)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }
        return round((($current - $previous) / $previous) * 100, 1);
    }

    public function getUsers()
    {
        return response()->json(User::latest()->paginate(20));
    }

    public function getPaidUsers()
    {
        return response()->json(
            User::where('role', 'premium')
                ->orWhereIn('sub_status', \App\Services\SubscriptionService::PAID_STATUSES)
                ->latest()
                ->paginate(20)
        );
    }

    public function getAdmins()
    {
        $admins = User::where('role', 'admin')->latest()->get();
        // Frontend expects {admins: [], users: []} maybe for dropdowns?
        // Let's return just admins for now or match structure if critical
        // Admins.js: setAdmin(response.data.admins), setUser(response.data.users)
        // It seems it wants a list of admins and a list of users to potentially promote?
        // Let's return both.
        return response()->json([
            'admins' => $admins,
            'users' => User::where('role', '!=', 'admin')->latest()->take(50)->get() // Limit for performance
        ]);
    }

    public function getAiStats()
    {
        $logs = \App\Models\AiUsageLog::all();
        $totalTokens = $logs->sum('tokens_used');
        $byFeature = $logs->groupBy('feature')->map(function ($row) {
            return $row->sum('tokens_used');
        });
        
        return response()->json([
            'total_tokens' => $totalTokens,
            'by_feature' => $byFeature
        ]);
    }

    public function assignPremium(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $planSlug = $request->input('plan_slug', 'pro');
        $plan = \App\Models\Plan::where('slug', $planSlug)->firstOrFail();

        // Cancel existing subs
        \App\Models\Subscription::where('user_id', $user->id)->where('status', 'active')->update(['status' => 'cancelled']);

        // Create Manual Subscription
        \App\Models\Subscription::create([
            'user_id' => $user->id,
            'plan_limit' => $plan->course_limit,
            'plan_price' => $plan->price_egp,
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addYear(), // Admin manual assignments are yearly by default for now
        ]);

        $role = $planSlug === 'free' ? 'user' : 'premium';

        $user->update([
            'sub_status' => $planSlug,
            'role' => $role,
            'subscription_started_at' => now(),
        ]);

        $planName = is_array($plan->name) ? ($plan->name['en'] ?? $plan->name['ar'] ?? 'Plan') : $plan->name;

        return response()->json(['message' => "admin.user_upgraded", 'plan' => $planName]);
    }

    public function getPlans()
    {
        return response()->json(\App\Models\Plan::all());
    }

    public function updatePlan(Request $request, $id)
    {
        $request->validate([
            'name' => 'sometimes|array',
            'price_egp' => 'sometimes|integer',
            'course_limit' => 'sometimes|integer',
            'description' => 'sometimes|array',
            'features' => 'sometimes|array',
        ]);

        $plan = \App\Models\Plan::findOrFail($id);
        $plan->update($request->only(['name', 'price_egp', 'course_limit', 'description', 'features']));

        return response()->json([
            'success' => true,
            'message' => 'admin.plan_updated',
            'plan' => $plan
        ]);
    }

    public function getCourses()
    {
        return response()->json(Course::with('user')->latest()->paginate(20));
    }

    public function deleteCourse($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();
        return response()->json(['message' => 'common.course_deleted']);
    }

    public function updateCourse(Request $request, $id)
    {
        $request->validate([
            'title' => 'sometimes|string',
            'status' => 'sometimes|string',
            'type' => 'sometimes|string'
        ]);

        $course = Course::findOrFail($id);
        $course->update($request->only(['title', 'status', 'type']));

        return response()->json([
            'success' => true,
            'message' => 'common.course_updated',
            'course' => $course
        ]);
    }

    public function promoteUser(Request $request)
    {
        $user = User::where('email', $request->email)->firstOrFail();
        $user->update(['role' => 'admin']);
        return response()->json(['success' => true, 'message' => 'admin.user_promoted']);
    }

    public function demoteUser(Request $request)
    {
        $user = User::where('email', $request->email)->firstOrFail();
        // Prevent demoting self if needed, but for MVP keep simple
        $user->update(['role' => 'user']);
        return response()->json(['success' => true, 'message' => 'admin.admin_demoted']);
    }

    public function promoteUserById($id)
    {
        $user = User::findOrFail($id);
        $user->update(['role' => 'admin']);
        return response()->json(['success' => true, 'message' => 'admin.user_promoted']);
    }

    public function demoteUserById($id)
    {
        $user = User::findOrFail($id);
        $user->update(['role' => 'user']);
        return response()->json(['success' => true, 'message' => 'admin.admin_demoted']);
    }
    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting self or other admins if needed
        if ($user->role === 'admin' && $user->id === auth()->id()) {
            return response()->json(['error' => 'admin.cannot_delete_self'], 403);
        }

        // Manually cascade delete related records to ensure clean deletion
        $user->courses()->delete();
        $user->subscriptions()->delete();
        $user->payments()->delete();
        $user->aiUsageLogs()->delete();
        
        $user->delete();
        return response()->json(['message' => 'admin.user_deleted']);
    }
}
