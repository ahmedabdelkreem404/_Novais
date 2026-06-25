<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Subscription;

class SubscriptionSeeder extends Seeder
{
    public function run()
    {
        $user = User::first();

        if ($user) {
            // Clear old active subscriptions
            Subscription::where('user_id', $user->id)->update(['status' => 'cancelled']);

            // Create new active subscription
            Subscription::create([
                'user_id' => $user->id,
                'plan_id' => 'monthly',
                'payment_reference' => 'DEMO-' . uniqid(),
                'status' => 'active',
                'payment_method' => 'Paymob',
                'card_last4' => '4242',
                'start_date' => now(),
                'end_date' => now()->addMonth(),
            ]);

            $user->update([
                'sub_status' => 'premium',
                'role' => 'premium'
            ]);

            $this->command->info('Demo subscription created for user: ' . $user->email);
        } else {
            $this->command->error('No users found to seed subscription.');
        }
    }
}
