<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\NotificationDevice;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $userId = auth('api')->id();

        $notifications = AppNotification::query()
            ->where('user_id', $userId)
            ->readyForDelivery()
            ->latest()
            ->paginate((int) $request->input('per_page', 30));

        $unread = AppNotification::query()
            ->where('user_id', $userId)
            ->readyForDelivery()
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'data' => $notifications->items(),
            'unread_count' => $unread,
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function markRead(AppNotification $notification)
    {
        $this->authorizeNotification($notification);
        $notification->update(['read_at' => now()]);

        return response()->json(['success' => true, 'notification' => $notification->fresh()]);
    }

    public function markAllRead()
    {
        $userId = auth('api')->id();

        AppNotification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function registerDevice(Request $request)
    {
        $data = $request->validate([
            'device_id' => ['nullable', 'string', 'max:255'],
            'platform' => ['sometimes', 'string', 'max:50'],
            'push_token' => ['nullable', 'string', 'max:2000'],
        ]);

        $device = NotificationDevice::updateOrCreate(
            [
                'user_id' => auth('api')->id(),
                'device_id' => $data['device_id'] ?? $request->header('X-Device-ID') ?? 'unknown',
            ],
            [
                'platform' => $data['platform'] ?? 'mobile',
                'push_token' => $data['push_token'] ?? null,
                'last_seen_at' => now(),
            ]
        );

        return response()->json(['success' => true, 'device' => $device]);
    }

    public function adminIndex()
    {
        return response()->json(AppNotification::with('user:id,name,email')
            ->latest()
            ->paginate(30));
    }

    public function adminStore(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'type' => ['sometimes', 'string', 'in:info,success,warning,error,payment,course,system'],
            'target' => ['required', 'string', 'in:all,user'],
            'user_id' => ['required_if:target,user', 'nullable', 'exists:users,id'],
            'title_ar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'body_ar' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'scheduled_at' => ['sometimes', 'nullable', 'date'],
            'data' => ['sometimes', 'nullable', 'array'],
        ]);

        $scheduledAt = !empty($data['scheduled_at']) ? \Carbon\Carbon::parse($data['scheduled_at']) : now();
        $payloadData = $data['data'] ?? [];
        $payloadData['localized'] = array_filter([
            'en' => ['title' => $data['title'], 'body' => $data['body']],
            'ar' => !empty($data['title_ar']) || !empty($data['body_ar'])
                ? ['title' => $data['title_ar'] ?? $data['title'], 'body' => $data['body_ar'] ?? $data['body']]
                : null,
        ]);

        $base = [
            'title' => $data['title'],
            'body' => $data['body'],
            'type' => $data['type'] ?? 'info',
            'data' => $payloadData,
            'published_at' => $scheduledAt,
            'scheduled_at' => $scheduledAt,
        ];

        if ($data['target'] === 'all') {
            $created = 0;
            User::query()->select('id')->chunkById(200, function ($users) use ($base, &$created) {
                foreach ($users as $user) {
                    AppNotification::create($base + [
                        'user_id' => $user->id,
                        'is_broadcast' => true,
                    ]);
                    $created++;
                }
            });
            $notification = AppNotification::query()->latest()->first();
        } else {
            $notification = AppNotification::create($base + [
                'user_id' => $data['user_id'],
                'is_broadcast' => false,
            ]);
            $created = 1;
        }

        Log::info('notifications.created', [
            'admin_id' => auth('api')->id(),
            'notification_id' => $notification?->id,
            'target' => $data['target'],
            'created_count' => $created,
        ]);

        return response()->json([
            'success' => true,
            'created_count' => $created,
            'notification' => $notification,
        ], 201);
    }

    private function authorizeNotification(AppNotification $notification): void
    {
        $userId = auth('api')->id();
        if ($notification->user_id !== null && (int) $notification->user_id !== (int) $userId) {
            abort(403, 'common.unauthorized');
        }
    }
}
